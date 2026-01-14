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

    const { chatId } = await req.json();
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
        { error: "Only the group owner can delete the group" },
        { status: 403 },
      );
    }

    // Delete the group and all associated data
    // Prisma cascade deletes should handle participation and messages
    // if schema is set up correctly, but we'll do it explicitly if needed.
    // Our schema has User.chats onDelete: Cascade? Let's check schema again.

    // Delete the group and all associated data explicitly
    await prisma.$transaction([
      prisma.message.deleteMany({ where: { chatId } }),
      prisma.chatParticipant.deleteMany({ where: { chatId } }),
      prisma.notification.deleteMany({ where: { chatId } }),
      prisma.chat.delete({ where: { id: chatId } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Group deletion error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
