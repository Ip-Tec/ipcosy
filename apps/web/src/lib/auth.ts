import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@ipcosy/db";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      // check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existingUser) return true; // Allow login for existing users

      // Grace Period: Until 2026-01-21, allow anyone to join.
      const GRACE_PERIOD_END = new Date("2026-01-21T00:00:00Z");
      const isGracePeriod = new Date() < GRACE_PERIOD_END;

      if (isGracePeriod) return true;

      // Check for referral code in cookies
      const cookieStore = await cookies();
      const referralCode = cookieStore.get("ipcosy-referral")?.value;

      if (!referralCode) {
        // Allow if using a valid PublicInvite (logic to be added if PublicInvite uses cookies or separate flow)
        return false; // Block signup
      }

      // Validate Referral Code
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
      });

      if (referrer) {
        // Optionally link referral here or in createUser event if passed via some state
        // Ideally, we want to store this relationship.
        // Since we can't easily pass data to createUser event from here without a hack,
        // we might need to rely on the cookie again in createUser or update it here if possible (but user not created yet).
        return true;
      }

      // Check Public Invite
      const publicInvite = await prisma.publicInvite.findUnique({
        where: { code: referralCode },
      });

      if (
        publicInvite &&
        publicInvite.isActive &&
        publicInvite.expiresAt > new Date()
      ) {
        return true;
      }

      return false;
    },
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = user.id;
        (session.user as any).username = (user as any).username;
        (session.user as any).isPremium = (user as any).isPremium;
        (session.user as any).referralCode = (user as any).referralCode;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Generate initial username and referral code
      const baseName = user.name?.toLowerCase().replace(/\s+/g, "") || "user";
      const username = `${baseName}-${nanoid(4)}`;
      const referralCode = nanoid(10);

      const cookieStore = await cookies();
      const refCode = cookieStore.get("ipcosy-referral")?.value;
      const fingerprint = cookieStore.get("ipcosy-fingerprint")?.value;

      let referredById = null;
      if (refCode) {
        const referrer = await prisma.user.findUnique({
          where: { referralCode: refCode },
        });
        if (referrer) referredById = referrer.id;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          username,
          referralCode,
          referredById,
          registrationFingerprint: fingerprint,
        },
      });
    },
  },
  pages: {
    signIn: "/",
    error: "/invite-expired", // Redirect to error page on failure (e.g. AccessDenied)
  },
};
