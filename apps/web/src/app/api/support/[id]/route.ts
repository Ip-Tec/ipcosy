import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ipcosy/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
      include: {
        responses: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!ticket) {
      return new NextResponse("Ticket not found", { status: 404 });
    }

    // Verify user owns this ticket
    if (ticket.userId !== user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching support ticket:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: params.id },
    });

    if (!ticket) {
      return new NextResponse("Ticket not found", { status: 404 });
    }

    // Verify user owns this ticket
    if (ticket.userId !== user.id) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const body = await req.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const response = await prisma.supportResponse.create({
      data: {
        message,
        userId: user.id,
        ticketId: params.id,
      },
    });

    // Update ticket status to IN_PROGRESS if it was OPEN
    if (ticket.status === "OPEN") {
      await prisma.supportTicket.update({
        where: { id: params.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error adding support response:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
