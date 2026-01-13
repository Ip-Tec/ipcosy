import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      isPremium: boolean;
      isAdmin: boolean;
      referralCode?: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    isPremium: boolean;
    isAdmin: boolean;
    referralCode?: string;
  }
}
