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
      "Paystack verification data:",
      JSON.stringify(verifyData, null, 2),
    );

    if (verifyData.status && verifyData.data.status === "success") {
      const userId = verifyData.data.metadata?.userId;
      console.log("Paystack metadata userId:", userId);
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data: { isPremium: true },
        });
        console.log(`User ${userId} upgraded via backup callback verification`);
      }
      return NextResponse.redirect(
        new URL("/settings?status=success", req.url),
      );
    }

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
