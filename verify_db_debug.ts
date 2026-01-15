import { prisma } from "./packages/db";

async function main() {
  try {
    console.log("Testing DB connection...");
    const userCount = await prisma.user.count();
    console.log("User count:", userCount);

    console.log("Testing Chat query...");
    const chats = await prisma.chat.findMany({ take: 1 });
    console.log("Chats found:", chats.length);
    if (chats.length > 0) {
      console.log("First chat keys:", Object.keys(chats[0]));
    }

    console.log("DB Verification Success");
  } catch (e) {
    console.error("DB Verification Failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
