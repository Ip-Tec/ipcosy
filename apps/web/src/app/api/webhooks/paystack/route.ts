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
    console.log(
      `PAYSTACK EVENT: ${event.event}`,
      JSON.stringify(event, null, 2),
    );

    if (event.event === "charge.success") {
      let userId: string | undefined;

      // Robust Metadata Parsing
      const rawMetadata = event.data.metadata;

      // Attempt 1: Standard object
      if (typeof rawMetadata === "object" && rawMetadata !== null) {
        userId =
          rawMetadata.userId ||
          rawMetadata.custom_fields?.find(
            (f: any) => f.variable_name === "userId",
          )?.value;
      }

      // Attempt 2: JSON String
      if (typeof rawMetadata === "string") {
        try {
          const parsed = JSON.parse(rawMetadata);
          userId =
            parsed.userId ||
            parsed.custom_fields?.find((f: any) => f.variable_name === "userId")
              ?.value;
        } catch (e) {
          console.error("Failed to parse metadata string:", rawMetadata);
        }
      }

      console.log(`EXTRACTED USER ID: ${userId}`);

      if (!userId) {
        console.error(
          "CRITICAL: Payment succeeded but NO USER ID found in metadata.",
        );
        // Fallback: Try finding user by email if strict ID match fails?
        // Risky but maybe necessary if metadata is dropped.
        const email = event.data.customer.email;
        if (email) {
          console.log(`Fallback: Attempting to find user by email ${email}`);
          const userByEmail = await prisma.user.findUnique({
            where: { email },
          });
          if (userByEmail) userId = userByEmail.id;
        }
      }

      if (userId) {
        const updateResult = await prisma.user.update({
          where: { id: userId },
          data: { isPremium: true },
        });
        console.log(
          `DATABASE UPDATED: User ${userId} (${updateResult.email}) set to isPremium: true`,
        );
      } else {
        console.error("FINAL FAILURE: Could not identify user for payment.");
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
