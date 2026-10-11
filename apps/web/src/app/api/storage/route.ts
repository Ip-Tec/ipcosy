import { NextRequest, NextResponse } from "next/server";
import { prepareUpload } from "@/lib/storage";
import { requireStorageConfig, storageEnabled, validateUpload } from "@/lib/storage-policy";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ipcosy/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Deliberately do not silently fall back when an enabled provider is broken.
  return NextResponse.json({ provider: storageEnabled() ? "b2" : "uploadthing" }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (!storageEnabled()) return NextResponse.json({ error: "Storage is not enabled" }, { status: 503 });
  if (req.headers.get("origin") !== req.nextUrl.origin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body || typeof body.type !== "string" || typeof body.size !== "number" || (body.name !== undefined && (typeof body.name !== "string" || body.name.length > 255))) {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
  try { validateUpload(body.type, body.size); } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
  try {
    requireStorageConfig();
    const session = await getServerSession(authOptions);
    const fingerprint = req.cookies.get("ipcosy-fingerprint")?.value;
    if (!session?.user && (!fingerprint || !/^[a-zA-Z0-9_-]{8,128}$/.test(fingerprint))) {
      return NextResponse.json({ error: "Please refresh to initialize your anonymous session" }, { status: 401 });
    }
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { isBanned: true } });
      if (!user || user.isBanned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(await prepareUpload(body.type, body.size, body.name), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Storage upload preparation failed", error);
    return NextResponse.json({ error: "Uploads are temporarily unavailable" }, { status: 503 });
  }
}
