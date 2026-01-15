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

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || "";

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
          { username: { contains: query } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        isAdmin: true,
        isPremium: true,
        isBanned: true,
        image: true,
      },
      take: 20,
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Admin user list error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
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

    const { userId, isAdmin, isPremium, isBanned } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const data: any = {};
    if (typeof isAdmin === "boolean") data.isAdmin = isAdmin;
    if (typeof isPremium === "boolean") data.isPremium = isPremium;
    if (typeof isBanned === "boolean") data.isBanned = isBanned;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    // Prevent removing own admin status for safety?
    // Or just let it be. Usually, we want at least one admin.

    console.log(
      `ADMIN ACTION: User ${user.email} modifying target ${userId}. Data:`,
      JSON.stringify(data),
    );

    const result = await prisma.user.update({
      where: { id: userId },
      data,
    });

    console.log(
      `ADMIN ACTION SUCCESS: Updated user ${result.email} (${result.id}). New State:`,
      JSON.stringify(result),
    );

    return NextResponse.json({ success: true, user: result });
  } catch (error) {
    console.error("Admin toggle error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
