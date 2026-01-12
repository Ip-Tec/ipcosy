import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ipcosy/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { joinCode } = await req.json();
    if (!joinCode || typeof joinCode !== "string") {
      return NextResponse.json({ error: "Invalid join code" }, { status: 400 });
    }

    const user = session.user as any;
    const userId = user.id;

    // 1. Find Chat by Join Code
    const chat = await prisma.chat.findUnique({
      where: { joinCode: joinCode.toUpperCase() },
      include: {
        participants: true,
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // 2. Check if already a member
    const isMember = chat.participants.some((p) => p.userId === userId);
    if (isMember) {
      return NextResponse.json(
        { error: "You are already a member of this group" },
        { status: 400 },
      );
    }

    // 3. Check Join Limits for Free Users
    const isPremium = user.isPremium;
    if (!isPremium) {
      const joinedCount = await prisma.chatParticipant.count({
        where: {
          userId: userId,
          role: { in: ["MEMBER", "ADMIN"] }, // OWNER doesn't count towards joined? Or all do?
        },
      });

      if (joinedCount >= 2) {
        return NextResponse.json(
          {
            error:
              "Free users can only join 2 groups. Upgrade to Premium for unlimited access!",
          },
          { status: 403 },
        );
      }
    }

    // 4. Join the Group
    await prisma.chatParticipant.create({
      data: {
        userId: userId,
        chatId: chat.id,
        role: "MEMBER",
      },
    });

    return NextResponse.json({
      success: true,
      chatId: chat.id,
      chatName: chat.name,
    });
  } catch (error) {
    console.error("Group join error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
