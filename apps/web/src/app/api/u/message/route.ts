import { NextResponse } from "next/server";
import { prisma, ChatType } from "@ipcosy/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { captureMessageMetadata } from "@/lib/metadata";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { targetUserId, content, fileUrl } = await req.json();

    if (!targetUserId || (!content && !fileUrl)) {
      return NextResponse.json(
        { error: "Missing required fields (content or fileUrl)" },
        { status: 400 },
      );
    }

    // Capture metadata from request
    const metadata = await captureMessageMetadata();

    if (session?.user && (session.user as any).id === targetUserId) {
      return NextResponse.json(
        { error: "You cannot send a message to yourself." },
        { status: 400 },
      );
    }

    // Basic Rate Limiting: Check last 1 minute messages for this IP/Fingerprint
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentMessagesCount = await prisma.message.count({
      where: {
        OR: [
          { ipAddress: metadata.ipAddress },
          { deviceId: metadata.deviceId },
        ],
        createdAt: { gt: oneMinuteAgo },
      },
    });

    if (recentMessagesCount >= 10) {
      // Allow 10 messages per minute
      return NextResponse.json(
        { error: "Too many messages. Please wait a minute." },
        { status: 429 },
      );
    }

    let chatId: string | null = null;
    let senderId: string;

    if (session?.user) {
      // Authenticated user sending message
      senderId = (session.user as any).id;

      // Check for existing ANONYMOUS DM between these exact two users
      const existingChat = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          type: ChatType.ANONYMOUS,
          participants: {
            every: {
              userId: { in: [senderId, targetUserId] },
            },
          },
        },
      });

      if (existingChat) {
        chatId = existingChat.id;
      }

      if (!chatId) {
        const newChat = await prisma.chat.create({
          data: {
            isGroup: false,
            type: ChatType.ANONYMOUS,
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
          { error: "Anonymous messaging requires browser fingerprint. Please enable cookies." },
          { status: 400 },
        );
      }

      // Use unique guest users based on fingerprint
      const anonUser = await prisma.user.upsert({
        where: { fingerprint: fingerprint },
        update: {
          lastLogin: new Date(),
        },
        create: {
          name: "Guest " + fingerprint.substring(0, 4),
          username: `guest_${fingerprint.substring(0, 8)}_${Math.random().toString(36).substring(2, 6)}`,
          fingerprint: fingerprint,
          isPremium: false,
        },
      });

      senderId = anonUser.id;

      if (senderId === targetUserId) {
        return NextResponse.json(
          { error: "You cannot send a message to yourself." },
          { status: 400 },
        );
      }

      // Check for existing anonymous chat between these exact two users
      const existingChat = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          type: ChatType.ANONYMOUS,
          participants: {
            every: {
              userId: { in: [senderId, targetUserId] },
            },
          },
        },
      });

      if (existingChat) {
        chatId = existingChat.id;
      }

      if (!chatId) {
        const newChat = await prisma.chat.create({
          data: {
            isGroup: false,
            type: ChatType.ANONYMOUS,
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
      return NextResponse.json({ error: "Failed to initialize chat session." }, { status: 500 });
    }

    // Create message with metadata and update chat timestamp
    const message = await prisma.message.create({
      data: {
        content,
        fileUrl,
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
    });

    // Update chat timestamp
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Create notification for the recipient
    await createNotification(targetUserId, {
      type: "NEW_MESSAGE",
      title: "New anonymous message",
      body: (content || "").substring(0, 100),
      messageId: message.id,
      chatId: chatId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in api/u/message:", error);
    return NextResponse.json(
      { error: "Server error", details: (error as any).message },
      { status: 500 },
    );
  }
}
