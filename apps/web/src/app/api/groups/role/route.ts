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

    const { chatId, targetUserId, role } = await req.json();
    if (!chatId || !targetUserId || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const userId = (session.user as any).id;

    // 1. Verify requester is the OWNER
    const requester = await prisma.chatParticipant.findFirst({
      where: {
        userId: userId,
        chatId: chatId,
        role: "OWNER",
      },
    });

    if (!requester) {
      return NextResponse.json(
        { error: "Only the group owner can manage roles" },
        { status: 403 },
      );
    }

    // 2. Check if the owner is Premium
    const ownerUser = session.user as any;
    const isPremium = ownerUser.isPremium;

    if (!isPremium && role === "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Free group owners cannot create Admins. Upgrade to Premium to manage roles!",
        },
        { status: 403 },
      );
    }

    // 3. Update target participant's role
    await prisma.chatParticipant.update({
      where: {
        userId_chatId: { userId: targetUserId, chatId },
      },
      data: {
        role: role as any,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Role update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
