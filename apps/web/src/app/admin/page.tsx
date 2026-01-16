"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { SUPER_ADMIN_EMAILS } from "@/lib/constants";

export default function AdminOverviewPage() {
  const { data: session, status } = useSession();

  // System Stats State
  const [stats, setStats] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"overview" | "insights">("overview");
  const [loadingInsights, setLoadingInsights] = useState(false);

  const user = session?.user as any;
  const isAdmin = user?.email && SUPER_ADMIN_EMAILS.includes(user.email);

  useEffect(() => {
    if (!isAdmin) return;

    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => toast.error("Failed to load stats"));
  }, [isAdmin]);

  const loadDeepInsights = async () => {
    setViewMode("insights");
    if (stats?.growthChart) return;

    setLoadingInsights(true);
    try {
      const res = await fetch("/api/admin/stats?analytics=true");
      const data = await res.json();
      setStats(data);
    } catch (e) {
      toast.error("Failed to load deep insights");
    } finally {
      setLoadingInsights(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="space-y-8">
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-[2rem]" />
      </div>
    );
  }

  // Double check, though Layout handles it too
  if (!isAdmin) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-4 text-center space-y-4">
        <h1 className="text-4xl font-black text-red-500">Access Denied</h1>
        <p className="text-muted">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black">Dashboard Overview</h1>
        <p className="text-muted">Real-time system health and analytics.</p>
      </div>

      {/* Stats Toggle Tabs */}
      <div className="flex gap-4 border-b border-border pb-4">
        <button
          onClick={() => setViewMode("overview")}
          className={`px-4 py-2 font-bold transition-all ${
            viewMode === "overview"
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-foreground"
          }`}
        >
          Overview
        </button>
        <button
          onClick={loadDeepInsights}
          className={`px-4 py-2 font-bold transition-all flex items-center gap-2 ${
            viewMode === "insights"
              ? "border-b-2 border-primary text-primary"
              : "text-muted hover:text-foreground"
          }`}
        >
          Deep Insights ✨
          {loadingInsights && <span className="animate-spin text-xs">⏳</span>}
        </button>
      </div>

      {/* System Stats Section */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats?.totalUsers, icon: "👥" },
          { label: "Guest Users", value: stats?.guestUsers, icon: "👻" },
          { label: "Premium", value: stats?.premiumUsers, icon: "👑" },
          { label: "Total Chats", value: stats?.totalChats, icon: "💬" },
          { label: "Group Chats", value: stats?.groupChats, icon: "👨‍👩‍👧‍👦" },
          { label: "Total Msgs", value: stats?.totalMessages, icon: "✉️" },
          {
            label: "24h Msgs",
            value: stats?.last24hMessages,
            icon: "⚡",
          },
          // New Analytics Cards (if loaded)
          {
            label: "Active (24h)",
            value: stats?.activeUsers24h,
            icon: "🔥",
            hidden: !stats?.activeUsers24h,
          },
          {
            label: "New Users (24h)",
            value: stats?.newUsers24h,
            icon: "👶",
            hidden: !stats?.newUsers24h,
          },
          {
            label: "New Guests (24h)",
            value: stats?.newGuests24h,
            icon: "👻",
            hidden: !stats?.newGuests24h,
          },
        ]
          .filter((i) => !i.hidden)
          .map((item, idx) => (
            <div
              key={idx}
              className="bg-sidebar border border-border p-6 rounded-3xl shadow-sm hover:border-primary/20 transition-all group hover:-translate-y-1"
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-muted uppercase tracking-widest">
                  {item.label}
                </span>
                <span className="text-2xl group-hover:scale-110 transition-transform filter grayscale group-hover:grayscale-0">
                  {item.icon}
                </span>
              </div>
              {stats ? (
                <p className="text-3xl font-black mt-4 text-foreground">
                  {item.value?.toLocaleString() || "0"}
                </p>
              ) : (
                <Skeleton className="h-10 w-24 mt-4" />
              )}
            </div>
          ))}
      </section>

      {/* Deep Analytics Visuals */}
      {stats?.growthChart && (
        <section className="grid md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="bg-sidebar p-8 rounded-[2rem] border border-border shadow-lg hover:shadow-xl transition-shadow">
            <h3 className="font-bold mb-6 text-xl">
              User Growth{" "}
              <span className="text-muted font-normal text-sm ml-2">
                (Last 7 Days)
              </span>
            </h3>
            <div className="flex items-end justify-between h-48 gap-3">
              {stats.growthChart.map((d: any, i: number) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-3 flex-1"
                >
                  <div
                    className="w-full bg-primary/20 rounded-t-xl hover:bg-primary/40 transition-all relative group cursor-pointer"
                    style={{
                      height: `${(d.users / 50) * 100}%`,
                      minHeight: "10%",
                    }}
                  >
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                      {d.users} users
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-muted">
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-sidebar p-8 rounded-[2rem] border border-border shadow-lg hover:shadow-xl transition-shadow space-y-6">
            <h3 className="font-bold mb-2 text-xl">Message Distribution</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Anonymous Traffic</span>
                  <span className="text-purple-500">
                    {stats.anonymousMessages || 0}
                  </span>
                </div>
                <div className="h-3 bg-muted/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all duration-1000"
                    style={{
                      width: `${(stats.anonymousMessages / (stats.totalMessages || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span>Public / Identified Traffic</span>
                  <span className="text-blue-500">
                    {stats.publicMessages || 0}
                  </span>
                </div>
                <div className="h-3 bg-muted/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-1000"
                    style={{
                      width: `${(stats.publicMessages / (stats.totalMessages || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-8 border-t border-border mt-8 grid grid-cols-2 gap-4">
                <div className="bg-background/50 p-4 rounded-2xl flex items-center gap-4">
                  <div className="h-10 w-10 flex items-center justify-center bg-green-500/10 text-green-500 rounded-xl text-xl font-black">
                    {stats.activeGroups24h || 0}
                  </div>
                  <div>
                    <p className="font-bold text-sm">Active Communities</p>
                    <p className="text-[10px] text-muted">Last 24h Activity</p>
                  </div>
                </div>
                <div className="bg-background/50 p-4 rounded-2xl flex items-center gap-4">
                  <div className="h-10 w-10 flex items-center justify-center bg-orange-500/10 text-orange-500 rounded-xl text-xl font-black">
                    {Math.round(
                      (stats.activeUsers24h / (stats.totalUsers || 1)) * 100,
                    )}
                    %
                  </div>
                  <div>
                    <p className="font-bold text-sm">Engagement Rate</p>
                    <p className="text-[10px] text-muted">DAU / Total Users</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
