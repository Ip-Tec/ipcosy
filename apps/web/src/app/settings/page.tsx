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
import {
  ChevronLeft,
  Loader2,
  Bell,
  BellOff,
  Shield,
  User as UserIcon,
} from "lucide-react";

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
  const [isSavingAlias, setIsSavingAlias] = useState(false);
  const [premiumPrice, setPremiumPrice] = useState(450);
  const [dbUser, setDbUser] = useState<any>(null);
  const [notifPermission, setNotifPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const requestNotifPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
      if (result === "granted") {
        toast.success("Notifications enabled!");
      } else {
        toast.error("Notifications " + result);
      }
    }
  };

  useEffect(() => {
    setIsMounted(true);

    // Fetch latest DB status to override session (for premium sync)
    fetch("/api/user/status")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setDbUser(data);
          setAlias(data.username || data.name || "");
        }
      });

    fetch("/api/admin/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.premiumPrice) setPremiumPrice(data.premiumPrice);
      });
  }, [session]);

  const handleSaveAlias = async () => {
    if (!alias.trim() || isSavingAlias) return;

    setIsSavingAlias(true);
    try {
      const res = await fetch("/api/user/username", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: alias }),
      });

      if (res.ok) {
        toast.success("Username updated!");
        setIsEditing(false);
      } else {
        const errorText = await res.text();
        toast.error(errorText || "Failed to update username");
      }
    } catch (e) {
      toast.error("Error updating username");
    } finally {
      setIsSavingAlias(false);
    }
  };

  const user = dbUser || (session?.user as any);
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
          <ChevronLeft />
          Back to Chat
        </Link>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-2xl mx-auto w-full space-y-8">
        {/* Profile Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em] flex items-center gap-2">
            <UserIcon className="w-3 h-3" />
            Account Profile
          </h2>
          <div className="bg-sidebar rounded-[2rem] border border-border p-8 shadow-xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-purple-600"></div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
              {/* Avatar Column */}
              <div className="relative group">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary via-purple-500 to-blue-600 p-1 shadow-2xl">
                  <div className="w-full h-full rounded-full bg-sidebar flex items-center justify-center overflow-hidden border-4 border-sidebar">
                    {user?.image ? (
                      <img
                        src={user.image}
                        alt={user.name || ""}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-black text-primary">
                        {(alias || "??").substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                {isPremium && (
                  <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black p-1.5 rounded-full shadow-lg border-2 border-sidebar">
                    <Shield className="w-3 h-3 fill-current" />
                  </div>
                )}
              </div>

              {/* Info Column */}
              <div className="flex-1 w-full space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Display Alias
                      </label>
                      {!isPremium && (
                        <span className="text-[9px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          🔒 Premium Feature
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={alias}
                          onChange={(e) => setAlias(e.target.value)}
                          disabled={!isPremium || !isEditing || isSavingAlias}
                          className="w-full bg-background/50 border border-border rounded-2xl px-5 py-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60 placeholder:text-muted/30"
                          placeholder="What should we call you?"
                        />
                      </div>

                      {isPremium && (
                        <button
                          onClick={() =>
                            isEditing ? handleSaveAlias() : setIsEditing(true)
                          }
                          disabled={isSavingAlias}
                          className="cursor-pointer bg-primary text-white px-8 py-4 rounded-2xl font-black text-sm hover:translate-y-[-2px] hover:shadow-primary/20 shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]"
                        >
                          {isSavingAlias ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : isEditing ? (
                            "Save Changes"
                          ) : (
                            "Edit Profile"
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {!isPremium && (
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        <span className="font-bold text-primary">TIP:</span>{" "}
                        Unlock the ability to change your display name and hide
                        your identity even further with a custom alias.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em] flex items-center gap-2">
            <Bell className="w-3 h-3" />
            System Notifications
          </h2>
          <div className="bg-sidebar rounded-[2rem] border border-border p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div
                className={`p-4 rounded-2xl ${
                  notifPermission === "granted"
                    ? "bg-green-500/10 text-green-500"
                    : notifPermission === "denied"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-primary/10 text-primary"
                }`}
              >
                {notifPermission === "granted" ? (
                  <Bell className="w-6 h-6" />
                ) : (
                  <BellOff className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1">
                <p className="font-bold">Browser Notifications</p>
                <p className="text-xs text-muted-foreground">
                  {notifPermission === "granted"
                    ? "You are receiving real-time alerts."
                    : notifPermission === "denied"
                      ? "Notifications are blocked in your browser."
                      : "Click to enable background message alerts."}
                </p>
              </div>
            </div>

            {notifPermission !== "granted" && (
              <button
                onClick={requestNotifPermission}
                className="cursor-pointer bg-sidebar border-2 border-primary/20 text-primary hover:bg-primary hover:text-white px-6 py-3 rounded-2xl font-bold text-xs transition-all active:scale-95 whitespace-nowrap shadow-sm"
              >
                {notifPermission === "denied"
                  ? "Re-enable in Settings"
                  : "Enable Notifications"}
              </button>
            )}
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
