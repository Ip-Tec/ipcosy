"use client";

export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Copy,
  MessageSquare,
  Trophy,
  Eye,
  User,
  PenBox,
  Users,
  Zap,
  ArrowLeft,
  Link as LinkIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import { LoginPrompt } from "@/components/login-prompt";
import nextDynamic from "next/dynamic";
const UpgradeButton = nextDynamic(() => import("@/components/upgrade-button"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-16 bg-foreground/10 animate-pulse rounded-[1.5rem]" />
  ),
});

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [hasMounted, setHasMounted] = useState(false);
  const [origin, setOrigin] = useState("");
  const [premiumPrice, setPremiumPrice] = useState(450);
  const [dbUser, setDbUser] = useState<any>(null);

  useEffect(() => {
    setHasMounted(true);
    setOrigin(window.location.origin);

    // Fetch latest DB status (for premium sync)
    fetch("/api/user/status")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) setDbUser(data);
      });

    fetch("/api/admin/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.premiumPrice) setPremiumPrice(data.premiumPrice);
      });
  }, [session]);

  if (!hasMounted || status === "loading")
    return (
      <div className="flex h-screen flex-col bg-background text-foreground">
        <div className="flex items-center gap-4 border-b border-border bg-sidebar p-4 shadow-sm">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full space-y-8">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-[2rem]" />
        </div>
      </div>
    );
  if (status === "unauthenticated") return <LoginPrompt />;

  const user = dbUser || (session?.user as any);
  const username =
    user?.username || user?.name?.toLowerCase().replace(/\s+/g, "") || "user";
  const referralCode = user?.referralCode || "N/A";
  const publicLink = `${origin}/${username}`;
  const referralLink = `${origin}/r/${referralCode}`;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border bg-sidebar p-4 shadow-sm">
        <Link
          href="/"
          className="text-primary hover:opacity-80 transition-opacity flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Chat
        </Link>
        <h1 className="text-xl font-bold">Your Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl mx-auto w-full space-y-8">
        {/* Profile Card */}
        <div className="bg-sidebar rounded-3xl border border-border p-8 shadow-xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-500 to-purple-600 opacity-10"></div>

          <div className="relative">
            <div className="h-32 w-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 mx-auto flex items-center justify-center text-white text-5xl font-bold shadow-2xl ring-4 ring-sidebar overflow-hidden">
              {user?.image ? (
                <img
                  src={user.image}
                  alt={user.name || ""}
                  className="w-full h-full object-cover"
                />
              ) : (
                (user?.name || "??").substring(0, 2).toUpperCase()
              )}
            </div>
            <div className="mt-4">
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              <p className="text-sm text-muted font-medium mb-1">@{username}</p>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit mx-auto ${user?.isPremium ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20" : "bg-primary/10 text-primary border border-primary/20"}`}
              >
                {user?.isPremium ? (
                  <>
                    <Zap className="w-3 h-3 fill-yellow-600" /> Premium Member
                  </>
                ) : (
                  <>
                    <User className="w-3 h-3" /> Free Member
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-background rounded-2xl p-4 border border-border transition-all hover:border-primary/30">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1 flex items-center gap-1 justify-center">
                <MessageSquare className="w-3 h-3" /> Messages
              </p>
              <p className="text-2xl font-black">0</p>
            </div>
            <div className="bg-background rounded-2xl p-4 border border-border transition-all hover:border-primary/30">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1 flex items-center gap-1 justify-center">
                <Trophy className="w-3 h-3" /> Rank
              </p>
              <p className="text-2xl font-black">Newbie</p>
            </div>
            <div className="bg-background rounded-2xl p-4 border border-border transition-all hover:border-primary/30 col-span-2">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1 flex items-center gap-1 justify-center">
                <Eye className="w-3 h-3" /> Link Visits
              </p>
              <p className="text-2xl font-black">{user?.profileViews || 0}</p>
            </div>
          </div>
        </div>

        {/* Links Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] px-2">
            Personal Links
          </h2>
          <div className="bg-sidebar rounded-[2rem] border border-border p-8 shadow-sm space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
                <LinkIcon className="w-3 h-3" /> Public Message Link
              </label>
              <div className="flex gap-2">
                <div className="flex-1 bg-background p-4 rounded-2xl border border-border font-mono text-xs break-all select-all flex items-center">
                  {publicLink}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(publicLink);
                    toast.success("Link copied!");
                  }}
                  className="cursor-pointer bg-primary text-white p-4 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground italic px-2">
                Anyone with this link can send you an anonymous message.
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/50">
              <label className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-2">
                <Zap className="w-3 h-3" /> Referral Invitation
              </label>
              <div className="flex gap-2">
                <div className="flex-1 bg-background p-4 rounded-2xl border border-border font-mono text-xs break-all select-all flex items-center">
                  {referralLink}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(referralLink);
                    toast.success("Referral link copied!");
                  }}
                  className="cursor-pointer bg-primary text-white p-4 rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-lg"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground italic px-2">
                Invite friends to join. They need this link to create an
                account!
              </p>
            </div>
          </div>
        </section>

        {/* Premium Section */}
        {!user?.isPremium && (
          <div className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-transparent rounded-[2.5rem] p-10 border border-primary/20 relative overflow-hidden group">
            <div className="absolute -top-10 -right-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
              <svg
                width="240"
                height="240"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5M19 19C19 19.6 18.6 20 18 20H6C5.4 20 5 19.6 5 19V18H19V19Z" />
              </svg>
            </div>

            <div className="relative space-y-8">
              <div className="space-y-2">
                <h3 className="text-3xl font-black tracking-tight">
                  IPCosy Premium
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                  Unlock the full power of anonymous networking with advanced
                  features and exclusive privileges.
                </p>
              </div>

              <div className="grid gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                    <PenBox className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Custom Username</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                      Change your name anytime
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Multiple Groups</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                      Create and manage several communities
                    </p>
                  </div>
                </div>
              </div>

              <UpgradeButton
                user={user}
                premiumPrice={premiumPrice}
                className="w-full bg-foreground text-background font-black py-5 rounded-[1.5rem] hover:opacity-90 active:scale-[0.98] transition-all shadow-xl cursor-pointer"
              >
                Upgrade Now — ₦{premiumPrice.toLocaleString()}
              </UpgradeButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
