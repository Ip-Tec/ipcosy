"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { SUPER_ADMIN_EMAILS } from "@/lib/constants";

export default function AdminPage() {
  const { data: session, status } = useSession();

  // Basic Config State
  const [price, setPrice] = useState(450);
  const [isSaving, setIsSaving] = useState(false);

  // System Stats State
  const [stats, setStats] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"overview" | "insights">("overview");
  const [loadingInsights, setLoadingInsights] = useState(false);

  // User Management State
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Invite Management State
  const [invites, setInvites] = useState<any[]>([]);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  const user = session?.user as any;
  const isSuperAdmin = user?.email && SUPER_ADMIN_EMAILS.includes(user.email);
  const isAdmin = isSuperAdmin;

  useEffect(() => {
    if (!isAdmin) return;

    // Load Initial Data
    fetch("/api/admin/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.premiumPrice) setPrice(data.premiumPrice);
      });

    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => setStats(data));

    fetch("/api/admin/invites")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setInvites(data);
      });
  }, [isAdmin]);

  const loadDeepInsights = async () => {
    setViewMode("insights");
    // Only load if crucial data is missing (simple cache check)
    if (stats?.growthChart) return;

    setLoadingInsights(true);
    try {
      const res = await fetch("/api/admin/stats?analytics=true");
      const data = await res.json();
      setStats(data); // Merge extended stats
    } catch (e) {
      toast.error("Failed to load deep insights");
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleSavePrice = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ premiumPrice: price }),
      });
      if (res.ok) {
        toast.success("Price updated successfully!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update price");
      }
    } catch (e) {
      toast.error("Error updating price");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/admin/users?query=${encodeURIComponent(searchQuery)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  const handleUpdateUser = async (
    targetUserId: string,
    field: string,
    currentValue: boolean,
  ) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId, [field]: !currentValue }),
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`User updated: ${field} is now ${!currentValue}`);

        // Update local state with the ACTUAL data from the server (confirms DB write)
        if (data.user) {
          setUsers((prev) =>
            prev.map((u) => (u.id === targetUserId ? data.user : u)),
          );
        } else {
          // Fallback if no user returned (shouldn't happen with new API)
          setUsers((prev) =>
            prev.map((u) =>
              u.id === targetUserId ? { ...u, [field]: !currentValue } : u,
            ),
          );
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update user");
      }
    } catch (e) {
      toast.error("Error updating user");
    }
  };

  const handleGenerateInvite = async () => {
    setIsGeneratingInvite(true);
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 7 }),
      });
      if (res.ok) {
        const newInvite = await res.json();
        setInvites((prev) => [newInvite, ...prev]);
        toast.success("Invite code generated!");
      }
    } catch (e) {
      toast.error("Failed to generate invite");
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  const handleDeleteInvite = async (id: string) => {
    try {
      const res = await fetch("/api/admin/invites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setInvites((prev) => prev.filter((i) => i.id !== id));
        toast.success("Invite deleted");
      }
    } catch (e) {
      toast.error("Failed to delete invite");
    }
  };

  if (status === "loading")
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-12">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="h-64 w-full rounded-[2rem]" />
          <Skeleton className="h-64 w-full rounded-[2rem]" />
        </div>
      </div>
    );

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center space-y-4">
        <h1 className="text-4xl font-black text-red-500">Access Denied</h1>
        <p className="text-muted">
          You do not have permission to view this page.
        </p>
        <Link href="/" className="text-primary hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12 pb-24">
      <div className="space-y-2">
        <h1 className="text-4xl font-black">Admin Control Center</h1>
        <p className="text-muted text-sm uppercase tracking-widest font-bold opacity-50">
          Authorized Personnel Only
        </p>
      </div>

      {/* System Stats Section */}
      {/* Stats Toggle Tabs */}
      <div className="flex gap-4 border-b border-border pb-4">
        <button
          onClick={() => setViewMode("overview")}
          className={`px-4 py-2 font-bold transition-all ${viewMode === "overview" ? "border-b-2 border-primary text-primary" : "text-muted hover:text-foreground"}`}
        >
          Overview
        </button>
        <button
          onClick={loadDeepInsights}
          className={`px-4 py-2 font-bold transition-all flex items-center gap-2 ${viewMode === "insights" ? "border-b-2 border-primary text-primary" : "text-muted hover:text-foreground"}`}
        >
          Deep Insights ✨
          {loadingInsights && <span className="animate-spin text-xs">⏳</span>}
        </button>
      </div>

      {/* System Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats?.totalUsers, icon: "👥" },
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
        ]
          .filter((i) => !i.hidden)
          .map((item, idx) => (
            <div
              key={idx}
              className="bg-sidebar border border-border p-5 rounded-3xl shadow-sm hover:border-primary/20 transition-all group"
            >
              <div className="flex justify-between items-start">
                <span className="text-sm font-bold text-muted uppercase tracking-tighter">
                  {item.label}
                </span>
                <span className="text-xl group-hover:scale-110 transition-transform">
                  {item.icon}
                </span>
              </div>
              {stats ? (
                <p className="text-2xl font-black mt-2">
                  {item.value?.toLocaleString() || "0"}
                </p>
              ) : (
                <Skeleton className="h-8 w-16 mt-2" />
              )}
            </div>
          ))}
      </section>

      {/* Deep Analytics Visuals */}
      {stats?.growthChart && (
        <section className="grid md:grid-cols-2 gap-8">
          <div className="bg-sidebar p-6 rounded-[2rem] border border-border shadow-lg">
            <h3 className="font-bold mb-4">User Growth (Last 7 Days)</h3>
            <div className="flex items-end justify-between h-32 gap-2">
              {stats.growthChart.map((d: any, i: number) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-2 flex-1"
                >
                  <div
                    className="w-full bg-primary/20 rounded-t-lg hover:bg-primary/40 transition-all relative group"
                    style={{
                      height: `${(d.users / 50) * 100}%`,
                      minHeight: "10%",
                    }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.users}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-muted">
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-sidebar p-6 rounded-[2rem] border border-border shadow-lg space-y-4">
            <h3 className="font-bold mb-2">Message Distribution</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>Anonymous</span>
                  <span>{stats.anonymousMessages || 0}</span>
                </div>
                <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500"
                    style={{
                      width: `${(stats.anonymousMessages / (stats.totalMessages || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold">
                  <span>Public / Identified</span>
                  <span>{stats.publicMessages || 0}</span>
                </div>
                <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{
                      width: `${(stats.publicMessages / (stats.totalMessages || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-border mt-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 flex items-center justify-center bg-green-500/10 text-green-500 rounded-full text-xl font-black">
                    {stats.activeGroups24h || 0}
                  </div>
                  <div>
                    <p className="font-bold text-sm">Active Groups (24h)</p>
                    <p className="text-xs text-muted">
                      Communities with recent messages
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* User Management Search */}
        <section className="bg-sidebar rounded-[2rem] border border-border p-8 shadow-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Manage Users</h2>
            <p className="text-xs text-muted">Lookup and moderate accounts.</p>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onKeyDown={(e) => e.key === "Enter" && handleSearchUsers()}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name or email..."
                className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <button
                onClick={handleSearchUsers}
                className="cursor-pointer bg-foreground text-background px-4 rounded-xl font-bold text-sm hover:opacity-90"
              >
                🔍
              </button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {isSearching && (
                <p className="text-center text-xs text-muted animate-pulse">
                  Searching...
                </p>
              )}
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-4 bg-background rounded-2xl border border-border group hover:border-primary/30 transition-all space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/10 border border-primary/20">
                      {u.image ? (
                        <img
                          src={u.image}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-xs uppercase">
                          {u.name?.substring(0, 1)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs truncate flex items-center gap-2">
                        {u.name || "Unknown User"}
                        {u.isBanned && (
                          <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase">
                            Banned
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-muted truncate">
                        {u.email || u.username}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                    <button
                      onClick={() =>
                        handleUpdateUser(u.id, "isAdmin", u.isAdmin)
                      }
                      className={`cursor-pointer text-[9px] font-black px-3 py-1.5 rounded-lg border transition-all ${
                        u.isAdmin
                          ? "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500 hover:text-white"
                          : "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500 hover:text-white"
                      }`}
                    >
                      {u.isAdmin ? "REVOKE ADMIN" : "GRANT ADMIN"}
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateUser(u.id, "isPremium", u.isPremium)
                      }
                      className={`cursor-pointer text-[9px] font-black px-3 py-1.5 rounded-lg border transition-all ${
                        u.isPremium
                          ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500 hover:text-white"
                          : "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500 hover:text-white"
                      }`}
                    >
                      {u.isPremium ? "REVOKE PREMIUM" : "GRANT PREMIUM"}
                    </button>
                    <button
                      onClick={() =>
                        handleUpdateUser(u.id, "isBanned", u.isBanned)
                      }
                      className={`cursor-pointer text-[9px] font-black px-3 py-1.5 rounded-lg border transition-all ${
                        u.isBanned
                          ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500 hover:text-white"
                          : "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500 hover:text-white"
                      }`}
                    >
                      {u.isBanned ? "UNBAN USER" : "BAN USER"}
                    </button>
                  </div>
                </div>
              ))}
              {!isSearching && searchQuery && users.length === 0 && (
                <p className="text-center text-[10px] text-muted">
                  No users found.
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="space-y-8">
          {/* Price Management */}
          <section className="bg-sidebar rounded-[2rem] border border-border p-8 shadow-2xl space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold">Premium Pricing</h2>
              <p className="text-xs text-muted">Manage system costs.</p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-black text-primary">
                  ₦
                </span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-2xl pl-12 pr-5 py-4 text-lg font-black focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
              <button
                onClick={handleSavePrice}
                disabled={isSaving}
                className="cursor-pointer w-full bg-primary text-white py-4 rounded-2xl font-black hover:opacity-90 disabled:opacity-50 transition-all shadow-lg active:scale-95"
              >
                {isSaving ? "Saving..." : "Update Price"}
              </button>
            </div>
          </section>

          {/* Invitation Management */}
          <section className="bg-sidebar rounded-[2rem] border border-border p-8 shadow-2xl space-y-6">
            <div className="space-y-1">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">Invite Codes</h2>
                  <p className="text-xs text-muted">Manage public access.</p>
                </div>
                <button
                  onClick={handleGenerateInvite}
                  disabled={isGeneratingInvite}
                  className="cursor-pointer bg-primary text-white text-[10px] font-black px-3 py-2 rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50"
                >
                  {isGeneratingInvite ? "..." : "GENERATE"}
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {invites.length === 0 && (
                <p className="text-center py-8 text-[10px] text-muted italic">
                  No active invite codes.
                </p>
              )}
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-background rounded-xl border border-border"
                >
                  <div className="min-w-0">
                    <p className="font-mono font-black text-sm text-primary tracking-widest">
                      {invite.code}
                    </p>
                    <p className="text-[8px] text-muted uppercase">
                      Exp: {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteInvite(invite.id)}
                    className="p-2 text-muted hover:text-red-500 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="pt-8 border-t border-border">
        <Link
          href="/"
          className="text-sm text-muted hover:text-primary transition-colors flex items-center gap-2"
        >
          ← Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
