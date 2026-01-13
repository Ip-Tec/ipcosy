import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ipcosy/db";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // 1. Checks for Creation Limits (Fetch from DB to avoid stale session)
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });

    const isPremium = dbUser?.isPremium;
    if (!isPremium) {
      const createdCount = await prisma.chatParticipant.count({
        where: {
          userId: userId,
          role: "OWNER",
          chat: {
            isGroup: true,
          },
        },
      });

      if (createdCount >= 1) {
        return NextResponse.json(
          {
            error:
              "Free users can only create 1 group. Upgrade to Premium for unlimited groups!",
          },
          { status: 403 },
        );
      }
    }

    const { name } = await req.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Invalid group name" },
        { status: 400 },
      );
    }

    // 2. Generate Unique Join Code
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

    // 3. Create the Chat & Set Owner
    const chat = await prisma.chat.create({
      data: {
        isGroup: true,
        name: name,
        joinCode: joinCode,
        participants: {
          create: {
            userId: userId,
            role: "OWNER",
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      chatId: chat.id,
      joinCode: chat.joinCode,
    });
  } catch (error) {
    console.error("Group creation error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
