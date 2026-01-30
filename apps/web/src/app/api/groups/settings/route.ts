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

    const { chatId, isJoinCodePrivate, description, isPublic } = await req.json();
    const userId = (session.user as any).id;

    if (!chatId) {
      return NextResponse.json({ error: "Missing chatId" }, { status: 400 });
    }

    // Verify user is OWNER
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        userId_chatId: { userId, chatId },
      },
      select: { role: true },
    });

    if (!participant || participant.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only the group owner can change settings" },
        { status: 403 },
      );
    }

    const updateData: any = {};
    if (isJoinCodePrivate !== undefined)
      updateData.isJoinCodePrivate = isJoinCodePrivate;
    if (description !== undefined) updateData.description = description;
    if (isPublic !== undefined) updateData.isPublic = isPublic;

    await prisma.chat.update({
      where: { id: chatId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Group settings error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
