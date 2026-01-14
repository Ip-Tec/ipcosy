import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ipcosy/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get("chatId");
    const cursor = searchParams.get("cursor"); // For pagination later if needed

    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Verify user is a participant
    const participation = await prisma.chatParticipant.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
    });

    if (!participation) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if requester is premium
    const userStatus = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });
    const isPremium = !!userStatus?.isPremium;

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: "asc" }, // Oldest first for chat UI
      take: 50, // Limit to 50 for now
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true, // To identify anonymous user
            name: true,
          },
        },
      },
    });

    // Format for UI
    const formattedMessages = messages.map((msg) => {
      // Determine if sender is me
      const isMe = msg.userId === userId;

      // Determine alias
      // If it's an anonymous user (email is anonymous@ipcosy.system), use "Anonymous" or custom alias logic
      // But the UI just uses msg.alias.

      let alias = msg.user.username || msg.user.name || "Anonymous";
      if (msg.user.email === "anonymous@ipcosy.system") {
        alias = "Anonymous";
      }

      return {
        id: msg.id,
        text: msg.content,
        fileUrl: msg.fileUrl,
        sender: isMe ? "me" : "them",
        alias: alias,
        visitorId: msg.userId,
        time: new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
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
