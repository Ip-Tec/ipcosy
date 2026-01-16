import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupMessages() {
  const seventyTwoHoursAgo = new Date();
  seventyTwoHoursAgo.setHours(seventyTwoHoursAgo.getHours() - 72);

  console.log(
    `Cleaning up messages older than ${seventyTwoHoursAgo.toISOString()}...`,
  );

  try {
    // 1. Find IDs of messages to delete
    const messagesToDelete = await prisma.message.findMany({
      where: {
        createdAt: { lt: seventyTwoHoursAgo },
      },
      select: { id: true },
    });

    const count = messagesToDelete.length;

    if (count > 0) {
      // 2. Delete in a transaction to ensure all associated data is cleaned up if not cascading
      // Note: Reaction and Notification models have messageId foreign keys.
      // In the schema, Notification and Reaction both have onDelete: Cascade for messageId.

      const result = await prisma.message.deleteMany({
        where: {
          createdAt: { lt: seventyTwoHoursAgo },
        },
      });

      console.log(`Successfully deleted ${result.count} old messages.`);
    } else {
      console.log("No old messages found.");
    }
  } catch (error) {
    console.error("Error during message cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupMessages();
