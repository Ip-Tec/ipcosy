import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@ipcosy/db";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { linkAnonymousAccount } from "./link-account";

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

      // Grace Period: Until 2036-01-21, allow anyone to join.
      const GRACE_PERIOD_END = new Date("2036-01-21T00:00:00Z");
      const isGracePeriod = new Date() < GRACE_PERIOD_END;

      // Wrap DB call in try/catch to debug Vercel connection issues
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (existingUser) return true; // Allow login for existing users
      } catch (error) {
        console.error("Database connection failed during signIn:", error);
        // If DB is down, we might want to fail gracefully or let them in if grace period?
        // But if DB is down, creating user will fail anyway.
        // Let's rely on grace period check below, but proceed with caution.
      }

      if (isGracePeriod) return true;

      // Check for referral code in cookies
      const cookieStore = await cookies();
      const referralCode = cookieStore.get("ipcosy-referral")?.value;

      if (!referralCode) {
        // Allow if using a valid PublicInvite (logic to be added if PublicInvite uses cookies or separate flow)
        return false; // Block signup
      }

      try {
        // Validate Referral Code
        const referrer = await prisma.user.findUnique({
          where: { referralCode },
        });

        if (referrer) {
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
      } catch (error) {
        console.error("Error validating referral:", error);
      }

      return false;
    },
    async session({ session, user }) {
      if (session.user) {
        (session.user as any).id = user.id;
        (session.user as any).username = (user as any).username;
        (session.user as any).isPremium = (user as any).isPremium;
        (session.user as any).isAdmin = (user as any).isAdmin;
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

      // Link anonymous account if fingerprint exists
      if (fingerprint) {
        try {
          await linkAnonymousAccount(user.id, fingerprint);
        } catch (error) {
          console.error("Failed to link anonymous account:", error);
          // Don't fail registration if linking fails
        }
      }
    },
  },
  pages: {
    signIn: "/",
    error: "/invite-expired", // Redirect to error page on failure (e.g. AccessDenied)
  },
};
