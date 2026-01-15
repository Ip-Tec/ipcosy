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

    // 3. Check if user is blocked
    const block = await (prisma.chatBlock as any).findUnique({
      where: {
        chatId_userId: { chatId: chat.id, userId },
      },
    });

    if (block) {
      return NextResponse.json(
        { error: "You are blocked from this group." },
        { status: 403 },
      );
    }

    // 4. Check Member Limits based on Group Owner's Plan
    const ownerParticipant = chat.participants.find((p) => p.role === "OWNER");
    if (!ownerParticipant) {
      // Should theoretically not happen if data integrity is good
      return NextResponse.json(
        { error: "Group has no owner" },
        { status: 500 },
      );
    }

    // Fetch owner's plan details
    const owner = await prisma.user.findUnique({
      where: { id: ownerParticipant.userId },
      select: { isPremium: true },
    });

    const isOwnerPremium = owner?.isPremium || false;
    const currentMemberCount = chat.participants.length;
    const MEMBER_LIMIT = isOwnerPremium ? 100000 : 10;

    if (currentMemberCount >= MEMBER_LIMIT) {
      return NextResponse.json(
        {
          error: isOwnerPremium
            ? "This group has reached its maximum capacity."
            : "This group has reached the free limit of 10 members. The owner needs to upgrade to Premium.",
        },
        { status: 403 },
      );
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
