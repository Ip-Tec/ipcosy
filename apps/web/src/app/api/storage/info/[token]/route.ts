import { NextResponse } from "next/server";
import { attachmentDetails } from "@/lib/storage";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  try { const { token } = await params; return NextResponse.json(await attachmentDetails(token), { headers: { "Cache-Control": "private, max-age=60", "Referrer-Policy": "no-referrer" } }); }
  catch { return NextResponse.json({ error: "File unavailable" }, { status: 404 }); }
}
