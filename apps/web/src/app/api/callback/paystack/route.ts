import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@ipcosy/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reference = searchParams.get("reference");

  if (!reference) {
    return NextResponse.redirect(
      new URL("/settings?error=no_reference", req.url),
    );
  }

  try {
    // 1. Verify Transaction with Paystack
    console.log("Paystack Callback Triggered. Reference:", reference);

    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error("CRITICAL: PAYSTACK_SECRET_KEY is missing in callback!");
    }

    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const verifyData = await verifyRes.json();
    console.log(
      "Paystack Callback Verification Response:",
      JSON.stringify(verifyData, null, 2),
    );

    if (verifyData.status && verifyData.data.status === "success") {
      const rawMetadata = verifyData.data.metadata;
      const metadata =
        typeof rawMetadata === "string" ? JSON.parse(rawMetadata) : rawMetadata;

      const userId = metadata?.userId;
      console.log("Paystack Callback Metadata userId:", userId);

      if (userId) {
        const updateResult = await prisma.user.update({
          where: { id: userId },
          data: { isPremium: true },
        });
        console.log(
          `CALLBACK ACTIVATION: User ${userId} (${updateResult.email}) upgraded.`,
        );
      }
      return NextResponse.redirect(
        new URL("/settings?status=success", req.url),
      );
    }

    console.warn(
      "Paystack Callback: Transaction not successful according to verification API.",
    );
    return NextResponse.redirect(
      new URL("/settings?status=processed", req.url),
    );
  } catch (error) {
    console.error("Paystack callback error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=callback_failed", req.url),
    );
  }
}
