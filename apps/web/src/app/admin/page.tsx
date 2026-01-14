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
        toast.success("User updated!");
        setUsers((prev) =>
          prev.map((u) =>
            u.id === targetUserId ? { ...u, [field]: !currentValue } : u,
          ),
        );
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
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
        ].map((item, idx) => (
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
