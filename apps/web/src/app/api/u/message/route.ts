import { NextResponse } from "next/server";
import { prisma } from "@ipcosy/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { captureMessageMetadata } from "@/lib/metadata";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { targetUserId, content } = await req.json();

    if (!targetUserId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Capture metadata from request
    const metadata = await captureMessageMetadata();

    let chatId: string | null = null;
    let senderId: string;
    const isAnonymous = true; // All messages via this route are anonymous

    if (session?.user) {
      // Authenticated user sending message
      senderId = (session.user as any).id;

      // Check for existing ANONYMOUS DM
      const existingChat = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          type: "ANONYMOUS",
          AND: [
            { participants: { some: { userId: senderId } } },
            { participants: { some: { userId: targetUserId } } },
          ],
        },
      });

      if (existingChat) {
        chatId = existingChat.id;
      } else {
        const newChat = await prisma.chat.create({
          data: {
            isGroup: false,
            type: "ANONYMOUS",
            name: "Anonymous Messages",
            participants: {
              create: [
                { userId: senderId, role: "OWNER" },
                { userId: targetUserId, role: "MEMBER" },
              ],
            },
          },
        });
        chatId = newChat.id;
      }
    } else {
      // Anonymous user (visitor)
      // Get fingerprint from cookie or generate temporary ID
      const cookieHeader = req.headers.get("cookie");
      let fingerprint = null;

      if (cookieHeader) {
        const cookies = cookieHeader.split(";").map((c) => c.trim());
        const fpCookie = cookies.find((c) =>
          c.startsWith("ipcosy-fingerprint="),
        );
        if (fpCookie) {
          fingerprint = fpCookie.split("=")[1];
        }
      }

      if (!fingerprint) {
        return NextResponse.json(
          { error: "Anonymous messaging requires browser fingerprint" },
          { status: 400 },
        );
      }

      // Create or find anonymous user with this fingerprint
      const anonUser = await prisma.user.upsert({
        where: { fingerprint: fingerprint },
        update: {},
        create: {
          id: fingerprint,
          fingerprint: fingerprint,
          name: "Anonymous",
          username: `anon-${fingerprint.substring(0, 8)}`,
        },
      });

      senderId = anonUser.id;

      // Check for existing anonymous chat
      const existingChat = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          type: "ANONYMOUS",
          AND: [
            { participants: { some: { userId: senderId } } },
            { participants: { some: { userId: targetUserId } } },
          ],
        },
      });

      if (existingChat) {
        chatId = existingChat.id;
      } else {
        const newChat = await prisma.chat.create({
          data: {
            isGroup: false,
            type: "ANONYMOUS",
            name: "Anonymous Messages",
            participants: {
              create: [
                { userId: senderId, role: "MEMBER" },
                { userId: targetUserId, role: "OWNER" },
              ],
            },
          },
        });
        chatId = newChat.id;
      }
    }

    if (!chatId) {
      // ... existing error handler ...
      return NextResponse.json({ error: "Failed" }, { status: 500 });
    }

    // Create message with metadata and update chat timestamp
    await prisma.$transaction([
      prisma.message.create({
        data: {
          content,
          userId: senderId,
          chatId: chatId,
          isAnonymous: true,
          // Premium visible metadata
          deviceType: metadata.deviceType,
          deviceOS: metadata.deviceOS,
          browser: metadata.browser,
          city: metadata.city,
          country: metadata.country,
          // Admin-only metadata
          ipAddress: metadata.ipAddress,
          latitude: metadata.latitude,
          longitude: metadata.longitude,
          deviceId: metadata.deviceId,
          browserFingerprint: metadata.browserFingerprint,
          userAgent: metadata.userAgent,
        },
      }),
      prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in api/u/message:", error);
    return NextResponse.json(
      { error: "Server error", details: (error as any).message },
      { status: 500 },
    );
  }
}
