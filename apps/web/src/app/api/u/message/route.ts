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

    if (session?.user) {
      // Authenticated user sending message
      senderId = (session.user as any).id;

      // Check for existing DM (precisely between these two users)
      const existingChat = await prisma.chat.findFirst({
        where: {
          isGroup: false,
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
      // Anonymous user - find or create system "Anonymous" user
      const anonUser = await prisma.user.upsert({
        where: { email: "anonymous@ipcosy.system" },
        update: {},
        create: {
          email: "anonymous@ipcosy.system",
          name: "Anonymous",
          username: "anonymous",
        },
      });

      senderId = anonUser.id;

      // Check for existing anonymous chat with target
      const existingChat = await prisma.chat.findFirst({
        where: {
          isGroup: false,
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
      console.error("Failed to resolve chatId for message", {
        senderId,
        targetUserId,
      });
      return NextResponse.json(
        { error: "Conversation initialization failed" },
        { status: 500 },
      );
    }

    // Create message with metadata and update chat timestamp
    await prisma.$transaction([
      prisma.message.create({
        data: {
          content,
          userId: senderId,
          chatId: chatId,
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
