import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupGuests() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  console.log(
    `Cleaning up guest users inactive since ${thirtyDaysAgo.toISOString()}...`,
  );

  try {
    const guestsToDelete = await prisma.user.findMany({
      where: {
        fingerprint: { not: null },
        updatedAt: { lt: thirtyDaysAgo },
      },
      select: { id: true },
    });

    const count = guestsToDelete.length;

    if (count > 0) {
      // Delete in a transaction or loop if needed, but simple deleteMany is fine if relations are handled
      // Note: Message, Reaction, Notification models have userId fields.
      // If onDelete: Cascade is set on those relations, it will be smooth.
      // If not, we might need to delete them manually or set null.

      const result = await prisma.user.deleteMany({
        where: {
          fingerprint: { not: null },
          updatedAt: { lt: thirtyDaysAgo },
        },
      });

      console.log(`Successfully deleted ${result.count} inactive guest users.`);
    } else {
      console.log("No inactive guest users found.");
    }
  } catch (error) {
    console.error("Error during guest cleanup:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupGuests();
