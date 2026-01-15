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

    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    const userId = (session.user as any).id;

    // Verify user is a participant
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    const participant = chat.participants.find((p) => p.userId === userId);
    if (!participant) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // Join Code Visibility logic:
    // 1. If not private, everyone in group sees it.
    // 2. If private, only OWNER and ADMIN see it (or just OWNER per new requirement "only the group owner can view or change").
    // Let's stick to OWNER for view/change per user comment.
    const canSeeCode =
      !(chat as any).isJoinCodePrivate || participant.role === "OWNER";

    return NextResponse.json({
      id: chat.id,
      name: chat.name,
      description: (chat as any).description,
      isGroup: chat.isGroup,
      isJoinCodePrivate: (chat as any).isJoinCodePrivate,
      joinCode: canSeeCode ? chat.joinCode : null,
      joinCodeExpiresAt: canSeeCode ? (chat as any).joinCodeExpiresAt : null,
      myRole: participant.role,
      participants: chat.participants.map((p) => ({
        id: p.user.id,
        username: p.user.username || p.user.name,
        role: p.role,
        image: p.user.image,
      })),
    });
  } catch (error) {
    console.error("Group info error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
