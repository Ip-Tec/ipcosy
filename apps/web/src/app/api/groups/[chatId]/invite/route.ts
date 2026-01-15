import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ipcosy/db";
import { nanoid } from "nanoid";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { chatId } = await params;
    const userId = (session.user as any).id;

    // Verify user is OWNER of the group
    // Allowing ADMINs to manage invites could be a future enhancement,
    // but typically only owners manage critical settings unless delegated.
    // For now, let's restrict to OWNER as per group-settings-modal.tsx which shows settings for OWNER.
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
    });

    if (!participant || participant.role !== "OWNER") {
      return NextResponse.json(
        { error: "Only group owners can manage invte links" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const { action, expiresIn } = body;
    // action: 'REGENERATE' | 'UPDATE_EXPIRATION'
    // expiresIn: number of minutes, or null/undefined for no expiration, or handling specific preset values.
    // Let's assume expiresIn is minutes. If -1 or null, it means "Never".

    const updateData: any = {};

    if (action === "REGENERATE") {
      let joinCode = nanoid(6).toUpperCase();
      let isUnique = false;
      while (!isUnique) {
        const existing = await prisma.chat.findUnique({
          where: { joinCode },
        });
        if (!existing) {
          isUnique = true;
        } else {
          joinCode = nanoid(6).toUpperCase();
        }
      }
      updateData.joinCode = joinCode;

      // When regenerating, we might want to reset expiration or keep it?
      // Usually regenerating invalidates the old one.
      // Let's keep existing expiration logic unless explicitly invalidating or setting new one.
      // But if 'expiresIn' is provided with REGENERATE, we update it too.
    }

    if (expiresIn !== undefined) {
      if (expiresIn === null || expiresIn === -1) {
        updateData.joinCodeExpiresAt = null;
      } else {
        const expiryDate = new Date();
        expiryDate.setMinutes(expiryDate.getMinutes() + Number(expiresIn));
        updateData.joinCodeExpiresAt = expiryDate;
      }
    }

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: updateData,
      select: {
        joinCode: true,
        joinCodeExpiresAt: true,
      },
    });

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error("Invite link error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
