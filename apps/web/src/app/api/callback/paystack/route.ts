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
    // In a production app, you would verify the transaction here using Paystack API
    // https://api.paystack.co/transaction/verify/:reference

    // For now, we rely on the webhook for the source of truth,
    // but we can proactively redirect the user back to settings.
    return NextResponse.redirect(new URL("/settings?status=success", req.url));
  } catch (error) {
    console.error("Paystack callback error:", error);
    return NextResponse.redirect(
      new URL("/settings?error=callback_failed", req.url),
    );
  }
}
