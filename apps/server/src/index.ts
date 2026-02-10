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

    // 2. Rate Limiting Logic (based on visitorId fingerprint)
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
    let user = await prisma.user.findUnique({
      where: { id: visitorId },
    });

    if (!user) {
      user = await prisma.user.findUnique({
        where: { fingerprint: visitorId },
      });
    }

    if (!user) {
      // Create a unique guest user for this specific visitor fingerprint
      user = await prisma.user.create({
        data: {
          name: "Guest " + visitorId.substring(0, 4),
          username: `guest_${visitorId.substring(0, 8)}`,
          fingerprint: visitorId,
          isPremium: false,
        },
      });
    }

    (ws as any).userId = user.id;

    let chatId = payload.chatId || "mvp-lobby";

    // 4. Fetch Chat and Verify Membership
    let chatExists = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true },
    });

    // Fallback for lobby
    if (!chatExists && chatId === "mvp-lobby") {
      chatExists = await prisma.chat.upsert({
        where: { id: "mvp-lobby" },
        update: {},
        create: { id: "mvp-lobby", isGroup: true, name: "Public Lobby" },
        include: { participants: true },
      });
    }

    if (!chatExists) {
      ws.send(
        JSON.stringify({ type: "error", message: "Chat does not exist" }),
      );
      return;
    }

    // Enforce Membership for Groups (Lobby is public)
    if (chatExists.isGroup && chatId !== "mvp-lobby") {
      const isParticipant = chatExists.participants.some(
        (p) => p.userId === user!.id,
      );
      
      const isOwner = chatExists.participants.some(
        (p) => p.userId === user!.id && p.role === "OWNER"
      );

      console.log(`Checking membership for user ${user!.id} in chat ${chatId}. isParticipant: ${isParticipant}, isOwner: ${isOwner}`);

      if (!isParticipant && !isOwner) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "You must be a member to interact here",
          }),
        );
        return;
      }
    }

    // 5. Handle Typing Events
    if (payload.type === "typing") {
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

    // 6. Handle Message Events
    if (payload.text || payload.fileUrl) {
      // Handle Anonymous Rerouting
      const isAnonymous = payload.isAnonymous || false;

      if (
        (isAnonymous || chatExists.type === ChatType.ANONYMOUS) &&
        !payload.chatId &&
        payload.targetUserId
      ) {
        const targetUserId = payload.targetUserId;
        const senderId = user.id;

        // Find or Create Anonymous Chat
        let existingAnonChat = await prisma.chat.findFirst({
          where: {
            type: ChatType.ANONYMOUS,
            isGroup: false,
            AND: [
              { participants: { some: { userId: senderId } } },
              { participants: { some: { userId: targetUserId } } },
            ],
          },
          include: { participants: true },
        });

        if (existingAnonChat) {
          chatExists = existingAnonChat;
          chatId = chatExists.id;
        } else {
          // Create a NEW anonymous chat
          chatExists = await prisma.chat.create({
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
            include: { participants: true },
          });
          chatId = chatExists.id;
        }
      } else if (!payload.chatId && payload.targetUserId) {
        // Handle starting a regular DM (if not forced anonymous)
        const targetUserId = payload.targetUserId;
        const senderId = user.id;

        let existingDm = await prisma.chat.findFirst({
          where: {
            type: ChatType.DM,
            isGroup: false,
            AND: [
              { participants: { some: { userId: senderId } } },
              { participants: { some: { userId: targetUserId } } },
            ],
          },
          include: { participants: true },
        });

        if (existingDm) {
          chatExists = existingDm;
          chatId = chatExists.id;
        } else {
          chatExists = await prisma.chat.create({
            data: {
              type: ChatType.DM,
              isGroup: false,
              participants: {
                create: [
                  { userId: senderId, role: "OWNER" },
                  { userId: targetUserId, role: "OWNER" },
                ],
              },
            },
            include: { participants: true },
          });
          chatId = chatExists.id;
        }
      }

      const meta = ((payload as any).metadata as any) || {};

      const message = await prisma.message.create({
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

      // 4c. Create Notifications for others
      if (chatId !== "mvp-lobby") {
        const otherParticipants = chatExists.participants.filter(
          (p) => p.userId !== user!.id,
        );

        const senderName = isAnonymous
          ? "Anonymous"
          : user.username || user.name || "A member";

        for (const p of otherParticipants) {
          // Check if user has notifications enabled?
          // (Simplified for now, just create the record)
          await prisma.notification.create({
            data: {
              userId: p.userId,
              type: "NEW_MESSAGE",
              title: `New message from ${senderName}`,
              body: (payload.text || "Shared a file").substring(0, 100),
              messageId: message.id,
              chatId: chatId,
            },
          });
        }
      }

      // 5. Broadcast to participants only
      const echoPayload: any = { ...payload, chatId };

      // Sanitization: If anonymous, strip identifying fields from the broadcast payload
      if (isAnonymous) {
        delete echoPayload.visitorId;
        echoPayload.username = "Anonymous";
        echoPayload.image = null;
        if (echoPayload.alias) echoPayload.alias = "Anonymous";
      }

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
