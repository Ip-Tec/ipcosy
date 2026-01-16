import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ipcosy/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");
    const joinCode = searchParams.get("joinCode");

    if (!chatId && !joinCode) {
      return NextResponse.json(
        { error: "Missing chatId or joinCode" },
        { status: 400 },
      );
    }

    const userId = session?.user ? (session.user as any).id : null;

    // Verify chat and participation
    let chat;
    if (joinCode) {
      chat = await prisma.chat.findUnique({
        where: { joinCode },
      });
    } else {
      chat = await prisma.chat.findUnique({
        where: { id: chatId! },
      });
    }

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const participation = userId
      ? await prisma.chatParticipant.findUnique({
          where: {
            userId_chatId: {
              userId,
              chatId: chat.id,
            },
          },
        })
      : null;

    if (!participation && !chat.joinCode) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check expiration if non-member
    if (!participation && (chat as any).joinCodeExpiresAt) {
      if (new Date() > new Date((chat as any).joinCodeExpiresAt)) {
        return NextResponse.json({ error: "Invite expired" }, { status: 410 });
      }
    }

    const isPremium = userId
      ? !!(
          await prisma.user.findUnique({
            where: { id: userId },
            select: { isPremium: true },
          })
        )?.isPremium
      : false;

    // Actual chatId to fetch
    const targetChatId = chat.id;

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: { chatId: targetChatId },
      orderBy: { createdAt: "asc" }, // Oldest first for chat UI
      take: 50, // Limit to 50 for now
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true, // To identify anonymous user
            name: true,
            fingerprint: true, // To identify anonymous users
          },
        },
      },
    });

    // Format for UI
    const formattedMessages = messages.map((msg) => {
      // Determine if sender is me
      const isMe = userId ? msg.userId === userId : false;

      // Determine alias
      // If user has a fingerprint but no email, they're anonymous
      let alias = msg.user.username || msg.user.name || "Anonymous";
      if (msg.user.fingerprint && !msg.user.email) {
        alias = "Anonymous";
      }

      // Mask identity for anonymous messages if not the sender
      let maskedVisitorId = msg.userId;
      let finalAlias = alias;

      if (msg.isAnonymous && !isMe) {
        maskedVisitorId = "anonymous";
        finalAlias = "Anonymous";
      }

      return {
        id: msg.id,
        text: msg.content,
        fileUrl: msg.fileUrl,
        sender: isMe ? "me" : "them",
        alias: finalAlias,
        visitorId: maskedVisitorId,
        time: new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        isAnonymous: msg.isAnonymous,
        metadata:
          isPremium && !isMe
            ? {
                deviceType: msg.deviceType,
                deviceOS: msg.deviceOS,
                browser: msg.browser,
                city: msg.city,
                country: msg.country,
              }
            : null,
      };
    });

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
