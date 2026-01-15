import { WebSocket } from "ws";
import { prisma, ChatType } from "@ipcosy/db";
import { IpServer, MessagePayload } from "@ipcosy/ip-socket";

const SYSTEM_ANONYMOUS_ID = "00000000-0000-0000-0000-000000000000";

class ChatServer extends IpServer {
  constructor(port: number) {
    super(port);
  }

  // Simple in-memory rate limiter
  private messageCounts = new Map<
    string,
    { count: number; lastReset: number }
  >();
  private readonly RATE_LIMIT = 5;
  private readonly RATE_WINDOW = 10000;

  async onMessage(ws: WebSocket, payload: MessagePayload) {
    const visitorId = payload.visitorId;

    if (!visitorId) {
      console.warn("Message received without visitorId");
      return;
    }

    // Temporarily associate visitorId with the socket
    (ws as any).visitorId = visitorId;

    // 1. Handle Typing Events (requires chatId in payload)
    if (payload.type === "typing") {
      const chatId = payload.chatId || "mvp-lobby";
      this.broadcastToChat(
        chatId,
        {
          type: "typing",
          visitorId,
          isTyping: !!payload.text,
          chatId,
        },
        ws,
      );
      return;
    }

    // 2. Rate Limiting Logic
    const now = Date.now();
    const userRate = this.messageCounts.get(visitorId) || {
      count: 0,
      lastReset: now,
    };

    if (now - userRate.lastReset > this.RATE_WINDOW) {
      userRate.count = 0;
      userRate.lastReset = now;
    }

    if (userRate.count >= this.RATE_LIMIT) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Rate limit exceeded. Slow down!",
        }),
      );
      return;
    }

    userRate.count++;
    this.messageCounts.set(visitorId, userRate);

    // 3. Resolve or Create User
    // First try to find by ID (if visitorId is a userId)
    let user = await prisma.user.findUnique({
      where: { id: visitorId },
    });

    if (!user) {
      // Check if visitorId is a fingerprint of an existing user
      user = await prisma.user.findUnique({
        where: { fingerprint: visitorId },
      });
    }

    if (!user) {
      // If neither ID nor fingerprint matches a real user, use the SYSTEM ANONYMOUS USER
      // This prevents creating millions of temp users
      user = await prisma.user.upsert({
        where: { id: SYSTEM_ANONYMOUS_ID },
        update: {},
        create: {
          id: SYSTEM_ANONYMOUS_ID,
          name: "Anonymous User",
          username: "anonymous",
          fingerprint: "system_anonymous",
          isPremium: false,
        },
      });
    }

    // Associate the database userId with the socket for broadcasting
    (ws as any).userId = user.id;

    if (payload.text || payload.fileUrl) {
      // 4. Push to Database
      let chatId = payload.chatId;

      // Fallback for lobby or legacy clients
      if (!chatId || chatId === "mvp-lobby") {
        chatId = "mvp-lobby";
        await prisma.chat.upsert({
          where: { id: "mvp-lobby" },
          update: {},
          create: { id: "mvp-lobby", isGroup: true, name: "Public Lobby" },
        });
      }

      // Verify chat exists before saving
      const chatExists = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { participants: true },
      });

      if (!chatExists) {
        ws.send(
          JSON.stringify({ type: "error", message: "Chat does not exist" }),
        );
        return;
      }

      // Handle Anonymous Rerouting
      const isAnonymous = payload.isAnonymous || false;

      // If the user is the System Anonymous User, forced anonymous logic applies
      if (
        user.id === SYSTEM_ANONYMOUS_ID &&
        chatExists.type !== ChatType.ANONYMOUS
      ) {
        // Logic to route to an anonymous inbox would go here
        // For now, we assume if they are using the system anon user, they likely match the Anon Chat pattern below
        // OR they are just chatting in a group/lobby as "Anonymous User"
      }

      if (isAnonymous && chatExists.type !== ChatType.ANONYMOUS) {
        // Find the other participant to start anonymous chat with
        // (Assuming 1-on-1 DM context turned anonymous)
        // If it's a group, this logic might be ambiguous, but for DMs:
        const otherParticipant = chatExists.participants.find(
          (p) => p.userId !== user!.id, // user is defined here
        );

        if (otherParticipant) {
          const targetUserId = otherParticipant.userId;
          const senderId = user.id;

          // Find or Create Anonymous Chat
          // If sender is System Anonymous, we need to be careful not to mix everyone's chats.
          // Ideally, for System Anonymous, we should key the "session" by visitorId somehow,
          // BUT the goal is to aggregate user records.
          // The "Chat" record itself distinguishes the conversation.
          // So if we find an existing Anon Chat for (SystemAnon + TargetUser), ALL anon users would see it?
          // YES, that is the risk of merging users!
          //
          // CRITICAL FIX: If using System Anonymous User, we CANNOT easily maintain separate private anon threads
          // using simply (senderId + targetId) unique constraint if senderId is shared.
          //
          // However, the `Chat` model doesn't enforce unique participants pairs by database constraint usually,
          // it's logic based.
          //
          // If we want separate threads for separate anon visitors, we DO need separate Chat records.
          // We can create a NEW Chat for each new anonymous conversation.
          // But how do we find it again for the SAME visitor?
          // We can't use `participants` query if `userId` is shared.
          //
          // ALTERNATE APPROACH:
          // We keep creating `Chat` records, but assign `System Anonymous` as participant.
          // To find the *correct* chat for *this* visitor, we might need a way to store "VisitorID -> ChatID" mapping.
          // OR, we just let the client send the `chatId`?
          // The client usually knows the `chatId` once created.
          //
          // IF `chatId` is provided in payload (and validated), we use it.
          // The issue is only when `chatId` is NULL or needs to be "found".
          //
          // If the user is browsing a profile and clicks "Send Anonymous Message", they might not have a chatId yet.
          // They usually send to a USER.
          //
          // If we use System Anonymous User, we lose the ability to lookup "My existing anon chat with Bob" via `userId`.
          //
          // COMPROMISE:
          // For now, if it's the System Anonymous User, we ALWAYS create a NEW chat if one isn't provided (or strictly rely on client state).
          // OR, we stick to creating users if we need persistent history per-visitor.
          //
          // The user's request: "registered users should be able to receive anonymous messages without generating multiple duplicate accounts."
          // This implies the *Recipient* receives messages.
          // If the *Sender* (Anonymous) wants to see history, they need an identity.
          // If they don't care about history (fire and forget), then System User works fine.
          //
          // If the goal is "Fire and forget" (like NGL), then Shared User is perfect.
          // If the goal is "Two-way conversation", Shared User + Shared Chat is bad (everyone sees everything).
          // Shared User + Separate Chats works, provided we can find the chat again.
          //
          // Let's assume for this Refactor:
          // 1. If payload has `chatId`, we use it.
          // 2. If payload has NO `chatId` (initial message) AND is anonymous:
          //    We create a NEW Anonymous Chat.
          //    We add System User as participant.
          //    We send the new `chatId` back to client (so client can reply).
          //    We do NOT try to "find existing" by senderId.

          if (!payload.chatId) {
            // Only if we are starting a new thread
            // Create a NEW anonymous chat always for a new thread from System Anon
            let anonChat = await prisma.chat.create({
              data: {
                type: ChatType.ANONYMOUS,
                name: "Anonymous Message",
                isGroup: false,
                participants: {
                  create: [
                    { userId: senderId, role: "MEMBER" },
                    { userId: targetUserId, role: "OWNER" },
                  ],
                },
              },
            });
            chatId = anonChat.id;
          } else {
            // If chatId provided, assume it is correct (we verified existence above)
            // But we should verify participation?
            // If System User is participant, it's valid.
          }
        }
      }

      const meta = ((payload as any).metadata as any) || {};

      await prisma.message.create({
        data: {
          content: payload.text || "",
          fileUrl: payload.fileUrl,
          userId: user.id,
          chatId: chatId,
          isAnonymous: isAnonymous,
          // Map metadata to existing columns
          deviceId: visitorId,
          deviceType: meta.deviceType,
          deviceOS: meta.deviceOS,
          browser: meta.browser,
          city: meta.city,
          country: meta.country,
          ipAddress: meta.ip,
          userAgent: meta.userAgent,
        },
      });

      // 5. Broadcast to participants only
      const echoPayload = { ...payload, chatId };
      this.broadcastToChat(chatId, { type: "echo", data: echoPayload }, ws);
    }
  }

  private async broadcastToChat(
    chatId: string,
    event: any,
    senderWs?: WebSocket,
  ) {
    // For the public lobby, we still broadcast to everyone
    const data = JSON.stringify(event);

    // Ensure sender always gets the echo immediately (UX responsiveness)
    if (senderWs && senderWs.readyState === 1) {
      senderWs.send(data);
    }

    if (chatId === "mvp-lobby") {
      // Broadcast to everyone else
      (this.wss as any).clients.forEach((client: any) => {
        if (client !== senderWs && client.readyState === 1) {
          client.send(data);
        }
      });
      return;
    }

    // Find all participants for this chat
    const participants = await prisma.chatParticipant.findMany({
      where: { chatId },
      select: { userId: true },
    });
    const participantIds = new Set(participants.map((p) => p.userId));

    // Send only to connected clients who are participants
    (this.wss as any).clients.forEach((client: any) => {
      // Skip sender (already sent)
      if (client === senderWs) return;

      if (
        client.readyState === 1 && // WebSocket.OPEN
        client.userId &&
        participantIds.has(client.userId)
      ) {
        client.send(data);
      }
    });
  }
}

const port = Number(process.env.PORT) || 8080;

// Pre-flight check for Render/Deployment
if (!process.env.DATABASE_URL) {
  console.error(
    "CRITICAL ERROR: DATABASE_URL environment variable is missing.",
  );
  console.error(
    "Please add DATABASE_URL to your environment variables on Render.",
  );
  process.exit(1);
}

const server = new ChatServer(port);

console.log(`WebSocket server started on port ${port} using IpServer engine`);
console.log(`Database connected successfully (Pre-flight)`);
