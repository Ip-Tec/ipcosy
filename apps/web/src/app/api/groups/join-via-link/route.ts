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

    const { code } = await req.json();
    const userId = (session.user as any).id;

    if (!code) {
      return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    const chat = await prisma.chat.findUnique({
      where: { joinCode: code.toUpperCase() },
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 },
      );
    }

    // Check for blocks
    const block = await (prisma.chatBlock as any).findUnique({
      where: {
        chatId_userId: { chatId: chat.id, userId },
      },
    });

    if (block) {
      return NextResponse.json(
        { error: "You are blocked from this group" },
        { status: 403 },
      );
    }

    // Check expiration
    if (
      (chat as any).joinCodeExpiresAt &&
      new Date() > new Date((chat as any).joinCodeExpiresAt)
    ) {
      return NextResponse.json(
        { error: "Invite link expired" },
        { status: 410 },
      );
    }

    // Check if already a member
    const existingMember = await prisma.chatParticipant.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId: chat.id,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({
        success: true,
        chatId: chat.id,
        message: "Already a member",
      });
    }

    // Verify group limits for the group itself?
    // MAX_MEMBERS logic?
    // "Implementing group limits: allowing free users to create one group with a maximum of 10 members, and premium users to create unlimited groups with up to 100,000 members"
    // I need to check the OWNER of the group to see if they are premium.

    // Find owner
    const ownerParticipant = await prisma.chatParticipant.findFirst({
      where: { chatId: chat.id, role: "OWNER" },
      include: { user: { select: { isPremium: true } } },
    });

    if (ownerParticipant) {
      const isOwnerPremium = ownerParticipant.user.isPremium;
      const currentCount = await prisma.chatParticipant.count({
        where: { chatId: chat.id },
      });

      const limit = isOwnerPremium ? 100000 : 10;
      if (currentCount >= limit) {
        return NextResponse.json(
          { error: "Group has reached its member limit" },
          { status: 403 },
        );
      }
    }

    // Add user
    await prisma.chatParticipant.create({
      data: {
        userId,
        chatId: chat.id,
        role: "MEMBER",
      },
    });

    return NextResponse.json({ success: true, chatId: chat.id });
  } catch (error) {
    console.error("Join group error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
