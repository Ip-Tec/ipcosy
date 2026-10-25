import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@ipcosy/db";
import { authOptions } from "@/lib/auth";
import { verifyOneTapToken } from "@/lib/google-one-tap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const nonceName = "ipcosy-google-nonce";
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || !/^[\w-]+\.apps\.googleusercontent\.com$/.test(clientId)) return NextResponse.json({ enabled: false }, { headers: { "Cache-Control": "no-store" } });
  const nonce = randomBytes(32).toString("base64url");
  const response = NextResponse.json({ enabled: true, clientId, nonce }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(nonceName, nonce, { httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 3600 });
  return response;
}
export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const nonce = req.cookies.get(nonceName)?.value;
  const body = await req.json().catch(() => null);
  if (!clientId || !nonce || !/^[A-Za-z0-9_-]{43}$/.test(nonce) || typeof body?.credential !== "string" || body.credential.length > 10000) return NextResponse.json({ error: "Please try signing in again" }, { status: 400 });
  let identity;
  try { identity = await verifyOneTapToken(body.credential, clientId, nonce); }
  catch { return NextResponse.json({ error: "Google sign-in could not be verified" }, { status: 401 }); }
  try {
    const account = { provider: "google", type: "oauth" as const, providerAccountId: identity.sub };
    const linked = await prisma.account.findUnique({ where: { provider_providerAccountId: { provider: "google", providerAccountId: identity.sub } }, include: { user: true } });
    if (linked?.user.isBanned) return NextResponse.json({ error: "Account unavailable" }, { status: 403 });
    // Never merge unrelated accounts merely because their email addresses match.
    if (!linked && await prisma.user.findUnique({ where: { email: identity.email } })) return NextResponse.json({ error: "Use the existing Google sign-in button for this account" }, { status: 409 });
    const allowed = await authOptions.callbacks?.signIn?.({ user: (linked?.user || { email: identity.email, name: identity.name, image: identity.image }) as any, account: account as any, profile: { sub: identity.sub, email: identity.email, name: identity.name } as any });
    if (allowed !== true) return NextResponse.json({ error: "Sign-in is not available for this account" }, { status: 403 });
    const user = linked?.user || await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { email: identity.email, emailVerified: new Date(), name: identity.name, image: identity.image } });
      await tx.account.create({ data: { userId: created.id, ...account } });
      return created;
    });
    if (!linked) await authOptions.events?.createUser?.({ user: user as any });
    if (authOptions.session?.strategy === "jwt") throw new Error("Database session configuration required");
    const maxAge = authOptions.session?.maxAge || 30 * 24 * 60 * 60;
    const token = randomBytes(32).toString("base64url");
    const expires = new Date(Date.now() + maxAge * 1000);
    await prisma.session.create({ data: { sessionToken: token, userId: user.id, expires } });
    const secure = req.nextUrl.protocol === "https:";
    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(authOptions.cookies?.sessionToken?.name || (secure ? "__Secure-next-auth.session-token" : "next-auth.session-token"), token, { httpOnly: true, secure, sameSite: "lax", path: "/", expires, maxAge });
    response.cookies.set(nonceName, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
    return response;
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. You can continue using the site." }, { status: 503 });
  }
}
