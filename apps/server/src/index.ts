import { WebSocket } from "ws";
import { prisma } from "@ipcosy/db";
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

    // 1. Handle Typing Events
    if (payload.type === "typing") {
      this.broadcast({ type: "typing", visitorId, isTyping: !!payload.text });
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
    const user = await prisma.user.upsert({
      where: { fingerprint: visitorId },
      update: {},
      create: {
        id: visitorId,
        fingerprint: visitorId,
      },
    });

    if (payload.text || payload.fileUrl) {
      // 4. Push to Database
      let chatId = payload.chatId;

      // Fallback for lobby or legacy clients
      if (!chatId) {
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
      });
      if (!chatExists) {
        ws.send(
          JSON.stringify({ type: "error", message: "Chat does not exist" }),
        );
        return;
      }

      await prisma.message.create({
        data: {
          content: payload.text || "",
          fileUrl: payload.fileUrl,
          userId: user.id,
          chatId: chatId,
        },
      });
    }

    // 5. Broadcast to all connected clients
    this.broadcast({ type: "echo", data: payload });
  }
}

const port = Number(process.env.PORT) || 8080;
const server = new ChatServer(port);

console.log(`WebSocket server started on port ${port} using IpServer engine`);
