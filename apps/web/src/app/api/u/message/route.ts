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

      // Check for existing DM
      const existingChat = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: {
              userId: { in: [senderId, targetUserId] },
            },
          },
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
      let anonUser = await prisma.user.findUnique({
        where: { email: "anonymous@ipcosy.system" },
      });

      if (!anonUser) {
        anonUser = await prisma.user.create({
          data: {
            email: "anonymous@ipcosy.system",
            name: "Anonymous",
            username: "anonymous",
          },
        });
      }

      senderId = anonUser.id;

      // Check for existing anonymous chat with target
      const existingChat = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: {
              userId: { in: [senderId, targetUserId] },
            },
          },
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

    // Create message with metadata
    await prisma.message.create({
      data: {
        content,
        userId: senderId,
        chatId: chatId!,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
