import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ipcosy/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!session || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportedUserId, reason } = await req.json();

    if (!reportedUserId || !reason) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        reportedId: reportedUserId,
        reason,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error("Submit report error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
