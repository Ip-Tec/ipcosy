import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ipcosy/db";
import { SUPER_ADMIN_EMAILS } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    let config = await prisma.globalConfig.findUnique({
      where: { id: "global" },
    });

    if (!config) {
      config = await prisma.globalConfig.create({
        data: { id: "global", premiumPrice: 450 },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Config fetch error:", error);
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

    const { premiumPrice } = await req.json();
    if (typeof premiumPrice !== "number" || premiumPrice < 0) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const config = await prisma.globalConfig.upsert({
      where: { id: "global" },
      update: { premiumPrice },
      create: { id: "global", premiumPrice },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Config update error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
