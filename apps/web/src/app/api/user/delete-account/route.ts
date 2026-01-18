import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ipcosy/db";
import { NextRequest, NextResponse } from "next/server";

const DELETION_GRACE_PERIOD_DAYS = 35;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // If deletion is already requested, don't allow another request
    if (user.deletionRequestedAt) {
      return NextResponse.json(
        { error: "Account deletion already requested" },
        { status: 400 }
      );
    }

    const deletionRequestedAt = new Date();
    const deletionDate = new Date(
      deletionRequestedAt.getTime() + DELETION_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { deletionRequestedAt },
    });

    return NextResponse.json({
      message: "Account deletion scheduled",
      deletionDate,
      gracePeriodDays: DELETION_GRACE_PERIOD_DAYS,
    });
  } catch (error) {
    console.error("Error requesting account deletion:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    // If no deletion is requested, can't cancel
    if (!user.deletionRequestedAt) {
      return NextResponse.json(
        { error: "No deletion request found" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { deletionRequestedAt: null },
    });

    return NextResponse.json({
      message: "Account deletion request cancelled",
    });
  } catch (error) {
    console.error("Error cancelling account deletion:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
