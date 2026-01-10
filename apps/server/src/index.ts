import { WebSocketServer } from "ws";
import { prisma } from "@ipcosy/db";

const wss = new WebSocketServer({ port: 8080 });

console.log("WebSocket server started on port 8080");

wss.on("connection", async (ws) => {
  console.log("New client connected");

  // Create or find an anonymous user for this session (simplified for MVP)
  // In production, we'd use fingerprints or session tokens
  const user = await prisma.user.upsert({
    where: { id: "default-guest" }, // Using a placeholder ID for now
    update: {},
    create: { id: "default-guest" },
  });

  ws.on("message", async (data) => {
    try {
      const payload = JSON.parse(data.toString());
      console.log("Received:", payload);

      if (payload.text) {
        // Save to Database (Placeholder chat ID for MVP)
        const chat = await prisma.chat.upsert({
          where: { id: "mvp-lobby" },
          update: {},
          create: { id: "mvp-lobby", isGroup: true, name: "Public Lobby" },
        });

        await prisma.message.create({
          data: {
            content: payload.text,
            userId: user.id,
            chatId: chat.id,
          },
        });
      }

      // Broadcast to all connected clients (Echo + Broadcast)
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
