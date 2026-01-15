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

    const { chatId, targetUserId } = await req.json();
    const currentUserId = (session.user as any).id;

    if (!chatId || !targetUserId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Verify current user is OWNER or ADMIN
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        userId_chatId: { userId: currentUserId, chatId },
      },
    });

    if (
      !participant ||
      (participant.role !== "OWNER" && participant.role !== "ADMIN")
    ) {
      return NextResponse.json(
        { error: "Only admins or owners can remove members" },
        { status: 403 },
      );
    }

    // Verify target is not the owner (cannot remove owner)
    const targetParticipant = await prisma.chatParticipant.findUnique({
      where: {
        userId_chatId: { userId: targetUserId, chatId },
      },
    });

    if (!targetParticipant) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (targetParticipant.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot remove the owner" },
        { status: 400 },
      );
    }

    // Remove participant
    await prisma.chatParticipant.delete({
      where: {
        userId_chatId: { userId: targetUserId, chatId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove member error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
