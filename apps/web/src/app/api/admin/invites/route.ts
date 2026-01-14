import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ipcosy/db";
import { SUPER_ADMIN_EMAILS } from "@/lib/constants";
import { nanoid } from "nanoid";

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

    const invites = await prisma.publicInvite.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(invites);
  } catch (error) {
    console.error("Admin invites list error:", error);
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

    const { days } = await req.json();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (days || 7));

    const invite = await prisma.publicInvite.create({
      data: {
        code: nanoid(10).toUpperCase(),
        expiresAt,
        isActive: true,
      },
    });

    return NextResponse.json(invite);
  } catch (error) {
    console.error("Admin invite create error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
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

    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    await prisma.publicInvite.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin invite delete error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
