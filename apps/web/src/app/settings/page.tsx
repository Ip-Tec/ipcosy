"use client";

export const dynamic = "force-dynamic";

import { useTheme } from "next-themes";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import nextDynamic from "next/dynamic";
import { toast } from "sonner";
import { LoginPrompt } from "@/components/login-prompt";
import { APP_VERSION } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

const UpgradeButton = nextDynamic(() => import("@/components/upgrade-button"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-14 bg-primary/20 animate-pulse rounded-2xl" />
  ),
});

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();
  const [alias, setAlias] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [premiumPrice, setPremiumPrice] = useState(450);

  useEffect(() => {
    setIsMounted(true);
    if (session?.user) {
      setAlias((session.user as any).username || session.user.name || "");
    }
    fetch("/api/admin/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.premiumPrice) setPremiumPrice(data.premiumPrice);
      });
  }, [session]);

  const handleSaveAlias = async () => {
    setIsEditing(false);
    toast.success("Username updated!");
  };

  const user = session?.user as any;
  const isPremium = user?.isPremium;

  if (!isMounted || status === "loading")
    return (
      <div className="flex h-screen flex-col bg-background text-foreground">
        <div className="flex items-center gap-4 border-b border-border bg-sidebar p-4 shadow-sm">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full space-y-8">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  if (status === "unauthenticated") return <LoginPrompt />;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border bg-sidebar p-4 shadow-sm">
        <Link
          href="/"
          className="text-primary hover:opacity-80 transition-opacity"
        >
          ← Back to Chat
        </Link>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl mx-auto w-full space-y-8">
        {/* Profile Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
            Profile
          </h2>
          <div className="bg-sidebar rounded-2xl border border-border p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg overflow-hidden">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (alias || "??").substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-xs text-muted flex justify-between">
                  <span>Username</span>
                  {!isPremium && (
                    <span className="text-primary font-bold">
                      🔒 Locked (Premium Only)
                    </span>
                  )}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={alias}
                    onChange={(e) => setAlias(e.target.value)}
                    disabled={!isPremium || !isEditing}
                    className={`flex-1 bg-background border border-border rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed`}
                    placeholder="Enter your alias..."
                  />
                  {isPremium && (
                    <button
                      onClick={() =>
                        isEditing ? handleSaveAlias() : setIsEditing(true)
                      }
                      className="cursor-pointer bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:opacity-90"
                    >
                      {isEditing ? "Save" : "Edit"}
                    </button>
                  )}
                </div>
                {!isPremium && (
                  <p className="text-[10px] text-muted">
                    Upgrade to premium to change your username.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
            Appearance
          </h2>
          <div className="bg-sidebar rounded-2xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Theme Mode</span>
              <div className="flex bg-background p-1 rounded-xl border border-border">
                <button
                  onClick={() => setTheme("light")}
                  className={`cursor-pointer px-4 py-1.5 rounded-lg text-sm transition-all ${
                    theme === "light"
                      ? "bg-primary text-white shadow-md"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`cursor-pointer px-4 py-1.5 rounded-lg text-sm transition-all ${
                    theme === "dark"
                      ? "bg-primary text-white shadow-md"
                      : "hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>

            <p className="text-xs text-muted pt-2 border-t border-border">
              Select your preferred visual style. Night mode is easier on the
              eyes in low light.
            </p>
          </div>
        </section>

        {/* Premium Upgrade Section */}
        {!isPremium && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-primary uppercase tracking-wider">
              Premium Upgrade
            </h2>
            <div className="bg-primary/5 rounded-2xl border border-primary/20 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="font-bold text-lg">Go Premium</h3>
                  <p className="text-xs text-muted">
                    Unlock username changes, group creation, and more.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-primary">
                    ₦{premiumPrice.toLocaleString()}
                  </span>
                  {/* <p className="text-[10px] text-muted">One-time payment</p> */}
                </div>
              </div>

              <UpgradeButton user={user} premiumPrice={premiumPrice} />

              <div className="grid grid-cols-2 gap-2">
                {[
                  "✨ Custom Usernames",
                  "👥 Group Creation",
                  "📦 Higher File Limits",
                  "🛡️ Priority Support",
                ].map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-2 text-[10px] bg-white/50 dark:bg-black/20 p-2 rounded-lg"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* System & Legal Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
            System & Privacy
          </h2>
          <div className="bg-sidebar rounded-2xl border border-border overflow-hidden shadow-sm">
            <div className="p-5 border-b border-border space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Privacy & Security</span>
                <span className="text-[10px] bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-bold">
                  Secure
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                IPCosy uses end-to-end anonymity.
              </p>
            </div>

            <div className="p-5 border-b border-border space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">Data Usage</span>
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                  Local First
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Messages are temporarily stored.
              </p>
            </div>

            <div className="p-5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">App Version</span>
                <span className="text-xs font-mono text-muted">
                  {APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                IPCosy with Google SSO.
              </p>
            </div>
          </div>
        </section>

        <div className="text-center pt-8">
          <p className="text-xs text-muted">
            Your data is handled according to our privacy policy.
          </p>
        </div>
      </div>
    </div>
  );
}
