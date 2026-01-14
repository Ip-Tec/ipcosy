import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ipcosy/db";
import { SUPER_ADMIN_EMAILS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (
      !session ||
      !user ||
      !user.email ||
      !SUPER_ADMIN_EMAILS.includes(user.email)
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalUsers,
      premiumUsers,
      totalChats,
      groupChats,
      totalMessages,
      last24hMessages,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isPremium: true } }),
      prisma.chat.count(),
      prisma.chat.count({ where: { isGroup: true } }),
      prisma.message.count(),
      prisma.message.count({
        where: {
          createdAt: {
            gt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    return NextResponse.json({
      totalUsers,
      premiumUsers,
      totalChats,
      groupChats,
      totalMessages,
      last24hMessages,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
