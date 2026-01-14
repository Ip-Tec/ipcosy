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
    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 },
      );
    }

    const userId = (session.user as any).id;

    await prisma.chatParticipant.update({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
      data: {
        lastSeenAt: new Date(),
      } as any,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Seen API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
