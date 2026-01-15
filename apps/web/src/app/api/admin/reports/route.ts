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

    const reports = await prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reporter: {
          select: { name: true, email: true },
        },
        reported: {
          select: { id: true, name: true, email: true, isBanned: true },
        },
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Fetch reports error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  // RESOLVE REPORT
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

    const { reportId, status } = await req.json();

    const updated = await prisma.report.update({
      where: { id: reportId },
      data: { status },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update report error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
