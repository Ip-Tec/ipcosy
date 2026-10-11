import { NextResponse } from "next/server";
import { prepareDownload } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const response = NextResponse.redirect(await prepareDownload(token), 302);
    response.headers.set("Cache-Control", "private, no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    return NextResponse.json({ error: "File unavailable" }, { status: 404 });
  }
}
