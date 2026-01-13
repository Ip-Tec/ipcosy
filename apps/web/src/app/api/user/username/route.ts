import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ipcosy/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
});

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { username } = usernameSchema.parse(body);

    const userEmail = session.user.email;

    // Check premium status from DB (avoid stale session)
    const dbUser = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { isPremium: true },
    });

    if (!dbUser?.isPremium) {
      return new NextResponse("Premium shortcut detected! Upgrade required.", {
        status: 403,
      });
    }

    // Check availability
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing && existing.email !== userEmail) {
      return new NextResponse("Username already taken", { status: 409 });
    }

    // Update user
    await prisma.user.update({
      where: { email: userEmail },
      data: { username },
    });

    return NextResponse.json({ success: true, username });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid username format", { status: 400 });
    }
    console.error("Error updating username:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
