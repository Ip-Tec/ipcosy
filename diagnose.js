const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  try {
    const userCount = await prisma.user.count();
    const chatCount = await prisma.chat.count();
    const participantCount = await prisma.chatParticipant.count();
    const messageCount = await prisma.message.count();

    console.log("Counts:", {
      users: userCount,
      chats: chatCount,
      participants: participantCount,
      messages: messageCount
    });

    const firstParticipant = await prisma.chatParticipant.findFirst();
    console.log("First participant:", firstParticipant);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
