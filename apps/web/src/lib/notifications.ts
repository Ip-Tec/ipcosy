import { prisma } from "@ipcosy/db";

export interface NotificationData {
  type: "NEW_MESSAGE" | "NEW_CHAT" | "MENTION";
  title: string;
  body?: string;
  messageId?: string;
  chatId?: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  userId: string,
  data: NotificationData,
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: data.type,
        title: data.title,
        body: data.body,
        messageId: data.messageId,
        chatId: data.chatId,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}

/**
 * Check if user should be notified for a chat
 */
export async function shouldNotify(
  userId: string,
  chatId: string,
): Promise<boolean> {
  try {
    const participant = await prisma.chatParticipant.findUnique({
      where: {
        userId_chatId: {
          userId,
          chatId,
        },
      },
      select: {
        isMuted: true,
        mutedUntil: true,
        notificationsEnabled: true,
      },
    });

    if (!participant) return false;
    if (!participant.notificationsEnabled) return false;
    if (participant.isMuted) {
      // Check if temporary mute has expired
      if (participant.mutedUntil && participant.mutedUntil > new Date()) {
        return false;
      }
      // If permanent mute or expired temp mute
      if (!participant.mutedUntil) return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking notification status:", error);
    return false;
  }
}

/**
 * Notify all participants in a chat about a new message
 */
export async function notifyNewMessage(
  chatId: string,
  senderId: string,
  messageId: string,
  senderName: string,
  messagePreview: string,
): Promise<void> {
  try {
    const participants = await prisma.chatParticipant.findMany({
      where: {
        chatId,
        userId: { not: senderId }, // Don't notify the sender
      },
      select: { userId: true },
    });

    for (const participant of participants) {
      const should = await shouldNotify(participant.userId, chatId);
      if (should) {
        await createNotification(participant.userId, {
          type: "NEW_MESSAGE",
          title: `New message from ${senderName}`,
          body: messagePreview.substring(0, 100),
          messageId,
          chatId,
        });
      }
    }
  } catch (error) {
    console.error("Error notifying participants:", error);
  }
}
