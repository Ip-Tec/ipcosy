import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@ipcosy/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    console.log("Credo Webhook Received. Body length:", body.length);

    const webhookToken = process.env.CREDO_WEBHOOK_TOKEN;
    if (!webhookToken) {
      console.error("CRITICAL: CREDO_WEBHOOK_TOKEN is missing in environment variables!");
    }

    const signature = req.headers.get("x-signature") || req.headers.get("X-Signature");
    if (!signature) {
      console.error("Credo Webhook: Missing x-signature header.");
      return NextResponse.json({ error: "Missing signature" }, { status: 401 });
    }

    // Credo signature verification (HMAC-SHA512 using the Webhook Token)
    const expectedSignature = crypto
      .createHmac("sha512", webhookToken || "")
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Credo Webhook: Invalid signature detected.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    console.log(`CREDO EVENT: ${payload.event}`, JSON.stringify(payload, null, 2));

    // Handle transaction success (Standardizing on payload.event === "transaction.successful")
    if (payload.event === "transaction.successful" || payload.event === "charge.success") {
      const data = payload.data;
      let userId = data.metadata?.userId;

      // Fallback: If userId is not in metadata, try finding by email
      if (!userId && data.email) {
        console.log(`Fallback: Searching for user by email ${data.email}`);
        const user = await prisma.user.findUnique({
          where: { email: data.email },
        });
        if (user) userId = user.id;
      }

      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { isPremium: true },
        });
        console.log(`DATABASE UPDATED: User ${userId} is now Premium.`);
      } else {
        console.error("CRITICAL: Could not identify user for successful Credo payment.");
      }
    }

    return NextResponse.json({ status: 200, message: "Webhook processed" });
  } catch (error: any) {
    console.error("Credo Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
