import { WebSocket } from "ws";
import { prisma, ChatType } from "@ipcosy/db";
import { IpServer, MessagePayload } from "@ipcosy/ip-socket";

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

    // 3. Resolve or Create User by Fingerprint
    // 3. Resolve or Create User
    // First try to find by ID (if visitorId is a userId)
    let user = await prisma.user.findUnique({
      where: { id: visitorId },
    });

    if (!user) {
      // If not found by ID, treat as anonymous fingerprint
      user = await prisma.user.upsert({
        where: { fingerprint: visitorId },
        update: {},
        create: {
          id: visitorId,
          fingerprint: visitorId,
        },
      });
    }

    // Associate the REAL database userId with the socket for correct broadcasting
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
      if (isAnonymous && chatExists.type !== ChatType.ANONYMOUS) {
        // Find the other participant to start anonymous chat with
        const otherParticipant = chatExists.participants.find(
          (p) => p.userId !== user.id,
        );

        if (otherParticipant) {
          const targetUserId = otherParticipant.userId;
          const senderId = user.id;

          // Find or Create Anonymous Chat
          let anonChat = await prisma.chat.findFirst({
            where: {
              type: ChatType.ANONYMOUS,
              AND: [
                { participants: { some: { userId: senderId } } },
                { participants: { some: { userId: targetUserId } } },
              ],
            },
          });

          if (!anonChat) {
            anonChat = await prisma.chat.create({
              data: {
                type: ChatType.ANONYMOUS,
                name: "Anonymous Messages",
                isGroup: false,
                participants: {
                  create: [
                    { userId: senderId, role: "MEMBER" }, // Sender is member
                    { userId: targetUserId, role: "OWNER" }, // Recipient owns the inbox
                  ],
                },
              },
            });
          }

          chatId = anonChat.id;
        }
      }

      await prisma.message.create({
        data: {
          content: payload.text || "",
          fileUrl: payload.fileUrl,
          userId: user.id,
          chatId: chatId,
          isAnonymous: isAnonymous,
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
