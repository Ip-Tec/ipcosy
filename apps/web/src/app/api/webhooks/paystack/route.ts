import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@ipcosy/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    console.log("Paystack Webhook Received. Body length:", body.length);

    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error(
        "CRITICAL: PAYSTACK_SECRET_KEY is missing in environment variables!",
      );
    }

    const hash = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY || "")
      .update(body)
      .digest("hex");

    const signature = req.headers.get("x-paystack-signature");
    console.log("Paystack Webhook Signature Match:", hash === signature);

    if (hash !== signature) {
      console.error("Paystack Webhook: Invalid signature detected.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    console.log("Paystack Event Type:", event.event);

    if (event.event === "charge.success") {
      const userId = event.data.metadata?.userId;
      const amount = event.data.amount;
      const status = event.data.status;

      console.log(
        `Processing Success: User=${userId}, Amount=${amount}, Status=${status}`,
      );

      if (userId) {
        const updateResult = await prisma.user.update({
          where: { id: userId },
          data: { isPremium: true },
        });
        console.log(
          `DATABASE UPDATED: User ${userId} (${updateResult.email}) set to isPremium: true`,
        );
      } else {
        console.error("Paystack Webhook Error: userId missing in metadata.");
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
