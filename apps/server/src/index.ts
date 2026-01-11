import { WebSocketServer, WebSocket } from "ws";
import { prisma } from "@ipcosy/db";

const wss = new WebSocketServer({ port: 8080 });

console.log("WebSocket server started on port 8080");

// Simple in-memory rate limiter
const messageCounts = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 5; // messages
const RATE_WINDOW = 10000; // 10 seconds

wss.on("connection", async (ws) => {
  console.log("New client connected");

  ws.on("message", async (data) => {
    try {
      const payload = JSON.parse(data.toString());
      const visitorId = payload.visitorId;

      if (!visitorId) {
        console.warn("Message received without visitorId");
        return;
      }

      // 1. Rate Limiting Logic
      const now = Date.now();
      const userRate = messageCounts.get(visitorId) || {
        count: 0,
        lastReset: now,
      };

      if (now - userRate.lastReset > RATE_WINDOW) {
        userRate.count = 0;
        userRate.lastReset = now;
      }

      if (userRate.count >= RATE_LIMIT) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Rate limit exceeded. Slow down!",
          }),
        );
        return;
      }

      userRate.count++;
      messageCounts.set(visitorId, userRate);

      // 2. Resolve or Create User by Fingerprint
      const user = await prisma.user.upsert({
        where: { fingerprint: visitorId },
        update: {},
        create: {
          id: visitorId,
          fingerprint: visitorId,
        },
      });

      if (payload.text || payload.fileUrl) {
        // 3. Push to Database
        const chat = await prisma.chat.upsert({
          where: { id: "mvp-lobby" },
          update: {},
          create: { id: "mvp-lobby", isGroup: true, name: "Public Lobby" },
        });

        await prisma.message.create({
          data: {
            content: payload.text || "",
            fileUrl: payload.fileUrl,
            userId: user.id,
            chatId: chat.id,
          },
        });
      }

      // 4. Broadcast to all connected clients
      const outgoing = JSON.stringify({ type: "echo", data: payload });
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(outgoing);
        }
      });
    } catch (e) {
      console.error("Error processing message:", e);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});
