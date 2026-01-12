import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@ipcosy/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest("hex");

    if (hash !== req.headers.get("x-paystack-signature")) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === "charge.success") {
      const userId = event.data.metadata?.userId;

      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { isPremium: true },
        });
        console.log(`User ${userId} upgraded to premium via Paystack`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
