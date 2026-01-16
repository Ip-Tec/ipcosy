import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ipcosy/db";

export async function GET(req: NextRequest) {
  try {
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

    const chat = await prisma.chat.findFirst({
      where: joinCode ? { joinCode } : { id: chatId! },
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

    const participant = userId
      ? chat.participants.find((p) => p.userId === userId)
      : null;

    // Check if unauthenticated/non-member view is allowed
    // Only groups with valid join codes can be viewed
    if (!participant && !chat.joinCode) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isExpired =
      (chat as any).joinCodeExpiresAt &&
      new Date() > new Date((chat as any).joinCodeExpiresAt);

    if (!participant && isExpired) {
      return NextResponse.json({ error: "Invite expired" }, { status: 410 });
    }

    // Join Code Visibility logic:
    const canSeeCode =
      participant?.role === "OWNER" || !(chat as any).isJoinCodePrivate;

    // Helper to mask identity
    const maskName = (id: string) => {
      // Short 5-character string as requested
      return id.substring(0, 5).toUpperCase();
    };

    return NextResponse.json({
      id: chat.id,
      name: chat.name,
      description: (chat as any).description,
      isGroup: chat.isGroup,
      isJoinCodePrivate: (chat as any).isJoinCodePrivate,
      joinCode: canSeeCode ? chat.joinCode : null,
      joinCodeExpiresAt: canSeeCode ? (chat as any).joinCodeExpiresAt : null,
      myRole: participant?.role || null,
      participants: chat.participants.map((p) => ({
        id: p.id,
        userId: p.userId,
        username: maskName(p.userId),
        name: maskName(p.userId),
        role: p.role,
        image: null, // Hide images for anonymity in settings
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
