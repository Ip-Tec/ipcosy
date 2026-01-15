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
      let userId: string | undefined;

      // Robust Metadata Parsing
      const rawMetadata = verifyData.data.metadata;

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
          console.error(
            "Failed to parse metadata string in Callback:",
            rawMetadata,
          );
        }
      }

      // Fallback: Email lookup
      if (!userId && verifyData.data.customer?.email) {
        console.log(
          `Callback Fallback: Looking up user by email ${verifyData.data.customer.email}`,
        );
        const userByEmail = await prisma.user.findUnique({
          where: { email: verifyData.data.customer.email },
        });
        if (userByEmail) userId = userByEmail.id;
      }

      console.log("Paystack Callback Final userId:", userId);

      if (userId) {
        const updateResult = await prisma.user.update({
          where: { id: userId },
          data: { isPremium: true },
        });
        console.log(
          `CALLBACK ACTIVATION: User ${userId} (${updateResult.email}) upgraded.`,
        );
      } else {
        console.warn("Callback Warning: Could not identify user to upgrade.");
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
