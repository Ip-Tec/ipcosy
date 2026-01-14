import { PrismaClient, ChatType, ParticipantRole } from "@prisma/client";

export { ChatType, ParticipantRole };

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export * from "@prisma/client";
