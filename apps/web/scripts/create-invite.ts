// scripts/create-invite.ts
import { PrismaClient } from "@ipcosy/db";
import { nanoid } from "nanoid";

const prisma = new PrismaClient();

async function createInvite() {
  const code = nanoid(10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

  const invite = await prisma.publicInvite.create({
    data: {
      code,
      expiresAt,
      isActive: true,
    },
  });

  console.log(`Public Invite Created!`);
  console.log(`Code: ${invite.code}`);
  console.log(`Link: http://localhost:3000/r/${invite.code}`); // Adjust domain in prod
  console.log(`Expires: ${invite.expiresAt}`);
}

createInvite()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
