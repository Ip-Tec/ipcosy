import { prisma } from "@ipcosy/db";

async function main() {
  try {
    console.log("Checking database connection...");
    const userCount = await prisma.user.count();
    console.log(`Connection successful. Found ${userCount} users.`);

    console.log("Checking ChatParticipant model for lastSeenAt...");
    const participant = await prisma.chatParticipant.findFirst();
    if (participant) {
      console.log("Sample participant found:", participant);
      if ("lastSeenAt" in participant) {
        console.log("lastSeenAt field exists.");
      } else {
        console.log(
          "CRITICAL: lastSeenAt field is MISSING from the returned object.",
        );
      }
    } else {
      console.log("No participants found.");
    }

    console.log("Fetching first chat with messages...");
    const chat = await prisma.chat.findFirst({
      include: {
        messages: {
          take: 1,
        },
      },
    });
    console.log("Sample chat:", chat);
  } catch (error) {
    console.error("Diagnostic failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
