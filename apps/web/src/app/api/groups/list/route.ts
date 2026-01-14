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

    const userId = (session.user as any).id;

    const participations = await prisma.chatParticipant.findMany({
      where: { userId },
      include: {
        chat: {
          include: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { chat: { updatedAt: "desc" } },
    });

    const chats = await Promise.all(
      participations.map(async (p) => {
        const lastMsg = p.chat.messages[0];

        // Count messages since lastSeenAt
        const lastSeen = (p as any).lastSeenAt || new Date(0);
        const unreadCount = await prisma.message.count({
          where: {
            chatId: p.chat.id,
            createdAt: { gt: lastSeen },
            userId: { not: userId }, // Don't count own messages
          },
        });

        return {
          id: p.chat.id,
          name: p.chat.name || "Direct Message",
          isGroup: p.chat.isGroup,
          message: lastMsg ? lastMsg.content : "No messages yet",
          time: lastMsg
            ? lastMsg.createdAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          unread: unreadCount,
          lastSeenAt: (p as any).lastSeenAt,
        };
      }),
    );

    return NextResponse.json(chats);
  } catch (error) {
    console.error("Chat list error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
