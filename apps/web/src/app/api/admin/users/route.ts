import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ipcosy/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !user || !user.isAdmin) {
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

    if (!session || !user || !user.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, isAdmin, isPremium } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const data: any = {};
    if (typeof isAdmin === "boolean") data.isAdmin = isAdmin;
    if (typeof isPremium === "boolean") data.isPremium = isPremium;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    // Prevent removing own admin status for safety?
    // Or just let it be. Usually, we want at least one admin.

    await prisma.user.update({
      where: { id: userId },
      data,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin toggle error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
