import { prisma } from "@ipcosy/db";

/**
 * Link anonymous account to newly registered user
 * Transfers messages, updates chat participants, and creates friendships
 */
export async function linkAnonymousAccount(
  newUserId: string,
  fingerprint: string,
): Promise<void> {
  try {
    // Find the anonymous user with this fingerprint
    const anonymousUser = await prisma.user.findUnique({
      where: { fingerprint },
      include: {
        messages: {
          include: {
            chat: {
              include: {
                participants: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        chats: {
          include: {
            chat: {
              include: {
                participants: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!anonymousUser) {
      console.log("No anonymous user found with fingerprint:", fingerprint);
      return;
    }

    // Skip if this IS the anonymous user (fingerprint used as ID)
    if (anonymousUser.id === newUserId) {
      console.log("User ID matches fingerprint, skipping link");
      return;
    }

    console.log(`Linking anonymous user ${anonymousUser.id} to ${newUserId}`);

    // Track users to create friendships with
    const friendIds = new Set<string>();

    // 1. Transfer all messages from anonymous user to new user
    if (anonymousUser.messages.length > 0) {
      await prisma.message.updateMany({
        where: { userId: anonymousUser.id },
        data: { userId: newUserId },
      });

      console.log(
        `Transferred ${anonymousUser.messages.length} messages to new user`,
      );

      // Collect friend IDs from message recipients
      for (const message of anonymousUser.messages) {
        for (const participant of message.chat.participants) {
          if (
            participant.userId !== anonymousUser.id &&
            participant.userId !== newUserId
          ) {
            friendIds.add(participant.userId);
          }
        }
      }
    }

    // 2. Update chat participants - replace anonymous user with new user
    for (const participation of anonymousUser.chats) {
      const chatId = participation.chatId;

      // Check if new user is already a participant
      const existingParticipation = await prisma.chatParticipant.findUnique({
        where: {
          userId_chatId: {
            userId: newUserId,
            chatId,
          },
        },
      });

      if (existingParticipation) {
        // New user already in chat, just delete anonymous participation
        await prisma.chatParticipant.delete({
          where: { id: participation.id },
        });
      } else {
        // Transfer participation to new user
        await prisma.chatParticipant.update({
          where: { id: participation.id },
          data: { userId: newUserId },
        });

        // Collect friend IDs from chat participants
        for (const participant of participation.chat.participants) {
          if (
            participant.userId !== anonymousUser.id &&
            participant.userId !== newUserId
          ) {
            friendIds.add(participant.userId);
          }
        }
      }
    }

    // 3. Create friendships (bidirectional)
    for (const friendId of friendIds) {
      try {
        // Create friendship from new user to friend
        await prisma.friendship.create({
          data: {
            userId: newUserId,
            friendId: friendId,
          },
        });

        // Create reverse friendship
        await prisma.friendship.create({
          data: {
            userId: friendId,
            friendId: newUserId,
          },
        });

        console.log(`Created friendship between ${newUserId} and ${friendId}`);
      } catch (error) {
        // Friendship might already exist, ignore duplicate errors
        if ((error as any).code !== "P2002") {
          console.error("Error creating friendship:", error);
        }
      }
    }

    // 4. Delete the anonymous user (cascade will handle related data)
    await prisma.user.delete({
      where: { id: anonymousUser.id },
    });

    console.log(
      `Successfully linked anonymous account. Created ${friendIds.size} friendships.`,
    );
  } catch (error) {
    console.error("Error linking anonymous account:", error);
    throw error;
  }
}
