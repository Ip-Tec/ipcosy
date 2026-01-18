import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DELETION_GRACE_PERIOD_DAYS = 35;

async function cleanupDeletedAccounts() {
  const gracePeriodEnd = new Date();
  gracePeriodEnd.setDate(
    gracePeriodEnd.getDate() - DELETION_GRACE_PERIOD_DAYS
  );

  console.log(
    `Cleaning up accounts with deletion requested before ${gracePeriodEnd.toISOString()}...`
  );

  try {
    // Find users with deletion requested older than grace period
    const accountsToDelete = await prisma.user.findMany({
      where: {
        deletionRequestedAt: {
          lt: gracePeriodEnd,
          not: null,
        },
      },
      select: { id: true, email: true },
    });

    const count = accountsToDelete.length;

    if (count > 0) {
      console.log(
        `Found ${count} account(s) ready for deletion. Proceeding with cleanup...`
      );

      for (const account of accountsToDelete) {
        try {
          // Delete all user data (cascades to related records)
          // Messages are NOT deleted - they remain in chats
          await prisma.user.delete({
            where: { id: account.id },
          });

          console.log(`✓ Deleted account: ${account.email} (${account.id})`);
        } catch (error) {
          console.error(
            `✗ Failed to delete account ${account.email} (${account.id}):`,
            error
          );
        }
      }

      console.log(
        `Cleanup complete. Successfully deleted ${count} account(s).`
      );
    } else {
      console.log(
        "No accounts ready for deletion at this time."
      );
    }
  } catch (error) {
    console.error("Error during account cleanup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDeletedAccounts();
