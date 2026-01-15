import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ipcosy/db";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }

    const chat = await prisma.chat.findUnique({
      where: { joinCode: code },
      include: {
        participants: {
          take: 5, // Show first 5 members as preview? Or just count.
          select: {
            user: {
              select: {
                name: true,
                username: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: { participants: true },
        },
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check expiration
    if (
      chat.joinCodeExpiresAt &&
      new Date() > new Date(chat.joinCodeExpiresAt)
    ) {
      return NextResponse.json(
        { error: "Invite link expired", isExpired: true },
        { status: 410 },
      );
    }

    // Check if private code?
    // The schema comments say: "isJoinCodePrivate Boolean @default(true) // OWNER can toggle if members see join code"
    // Does this mean the code itself is private (cannot be used by public)?
    // Or just potentially hidden from members in the UI?
    // "It would be great if group owners could share a join link for their group" implies public/sharable link.
    // If "isJoinCodePrivate" meant "Disable Invite Link", that would be different.
    // But currently logical interpretation is: if you HAVE the code, you can use it.
    // The privacy flag might just be about DISCOVERABILITY within the app or showing it to members.
    // Let's assume if you have the link, you can fetch info.

    return NextResponse.json({
      id: chat.id,
      name: chat.name,
      membersCount: chat._count.participants,
      previewMembers: chat.participants.map((p) => p.user),
      isExpired: false,
    });
  } catch (error) {
    console.error("Fetch invite info error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
