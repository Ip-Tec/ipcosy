import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@ipcosy/db";
import { captureMessageMetadata } from "@/lib/metadata";
import { messageView } from "@/lib/message-view";
import { notifyNewMessage } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body.chatId !== "string" || typeof body.text !== "string" || body.text.length > 10000 ||
      (body.fileUrl !== undefined && (typeof body.fileUrl !== "string" || body.fileUrl.length > 191)) ||
      (!body.text.trim() && !body.fileUrl)) return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  if (body.fileUrl) {
    try { const url = new URL(body.fileUrl); if (url.protocol !== "https:") throw new Error(); }
    catch { return NextResponse.json({ error: "Invalid attachment" }, { status: 400 }); }
  }
  try {
    const session = await getServerSession(authOptions);
    const fingerprint = req.cookies.get("ipcosy-fingerprint")?.value;
    let user = session?.user?.id ? await prisma.user.findUnique({ where: { id: session.user.id } }) :
      fingerprint && /^[a-zA-Z0-9_-]{8,128}$/.test(fingerprint) ? await prisma.user.findUnique({ where: { fingerprint } }) : null;
    if (!user && !session?.user?.id && fingerprint && /^[a-zA-Z0-9_-]{8,128}$/.test(fingerprint) && body.chatId === "mvp-lobby") {
      user = await prisma.user.upsert({ where: { fingerprint }, update: {}, create: { fingerprint, name: "Guest" } });
    }
    if (!user) return NextResponse.json({ error: "Please sign in or refresh your anonymous session" }, { status: 401 });
    if (user.isBanned) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const chat = await prisma.chat.findUnique({ where: { id: body.chatId }, include: { participants: true } });
    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    if (chat.id !== "mvp-lobby" && !chat.participants.some((p) => p.userId === user!.id)) {
      return NextResponse.json({ error: "Join this chat before sending" }, { status: 403 });
    }
    const blocked = await prisma.chatBlock.findUnique({ where: { chatId_userId: { chatId: chat.id, userId: user.id } } });
    if (blocked) return NextResponse.json({ error: "You are blocked from this chat" }, { status: 403 });
    const recent = await prisma.message.count({ where: { userId: user.id, createdAt: { gt: new Date(Date.now() - 60000) } } });
    if (recent >= 20) return NextResponse.json({ error: "Please slow down and try again shortly" }, { status: 429 });
    const metadata = await captureMessageMetadata();
    const isAnonymous = body.isAnonymous === true || !user.email;
    const message = await prisma.$transaction(async (tx) => {
      const saved = await tx.message.create({ data: {
        content: body.text, fileUrl: body.fileUrl, chatId: chat.id, userId: user!.id, isAnonymous, ...metadata,
      }, include: { user: { select: { username: true, name: true, email: true, fingerprint: true } } } });
      await tx.chat.update({ where: { id: chat.id }, data: { updatedAt: new Date() } });
      return saved;
    });
    await notifyNewMessage(chat.id, user.id, message.id, isAnonymous ? "Anonymous" : user.username || user.name || "A member", body.text || "Shared a file");
    return NextResponse.json(messageView(message, user.id, false), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Chat message failed", error);
    return NextResponse.json({ error: "Message could not be sent. Please try again." }, { status: 503 });
  }
}
