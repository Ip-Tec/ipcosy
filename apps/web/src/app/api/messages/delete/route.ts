import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ipcosy/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    let userId: string;

    if (session?.user) {
      userId = (session.user as any).id;
    } else {
      // Fallback to fingerprint for guests
      const cookieHeader = req.headers.get("cookie");
      let fingerprint = null;

      if (cookieHeader) {
        const cookies = cookieHeader.split(";").map((c) => c.trim());
        const fpCookie = cookies.find((c) =>
          c.startsWith("ipcosy-fingerprint="),
        );
        if (fpCookie) {
          fingerprint = fpCookie.split("=")[1];
        }
      }

      if (!fingerprint) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Find the guest user by fingerprint
      const guestUser = await prisma.user.findUnique({
        where: { fingerprint: fingerprint },
        select: { id: true },
      });

      if (!guestUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      userId = guestUser.id;
    }

    const { messageId } = await req.json();

    if (!messageId) {
      return NextResponse.json({ error: "Missing messageId" }, { status: 400 });
    }

    // Find the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { userId: true, chatId: true },
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Verify user is the message sender
    if (message.userId !== userId) {
      return NextResponse.json(
        { error: "You can only delete your own messages" },
        { status: 403 },
      );
    }

    // Delete the message
    await prisma.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json({
      success: true,
      messageId,
      chatId: message.chatId,
    });
  } catch (error) {
    console.error("Message deletion error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
