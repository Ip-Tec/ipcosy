"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

        if (data.user) {
          setUsers((prev) =>
            prev.map((u) => (u.id === targetUserId ? data.user : u)),
          );
        } else {
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

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black">User Management</h1>
        <p className="text-muted">
          Search, moderate, and manage user accounts.
        </p>
      </div>

      <section className="bg-sidebar rounded-[2rem] border border-border p-8 shadow-2xl space-y-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onKeyDown={(e) => e.key === "Enter" && handleSearchUsers()}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or username..."
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
            <button
              onClick={handleSearchUsers}
              className="cursor-pointer bg-foreground text-background px-6 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {isSearching && (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                ))}
              </div>
            )}

            {!isSearching && users.length > 0 && (
              <div className="grid gap-3">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="p-5 bg-background rounded-2xl border border-border group hover:border-primary/30 transition-all space-y-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex-shrink-0">
                        {u.image ? (
                          <img
                            src={u.image}
                            className="w-full h-full object-cover"
                            alt={u.name}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-sm uppercase text-primary">
                            {u.name?.substring(0, 1) || "U"}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm truncate">
                            {u.name || "Unknown User"}
                          </p>
                          {u.isBanned && (
                            <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                              BANNED
                            </span>
                          )}
                          {u.isPremium && (
                            <span className="bg-yellow-500/20 text-yellow-600 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-yellow-500/20">
                              PREMIUM
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted truncate font-mono mt-0.5">
                          {u.email} <span className="opacity-30 mx-1">|</span> @
                          {u.username || "no_username"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-border/50">
                      <button
                        onClick={() =>
                          handleUpdateUser(u.id, "isAdmin", u.isAdmin)
                        }
                        className={`cursor-pointer text-[10px] font-black px-4 py-2 rounded-xl border transition-all flex-1 ${
                          u.isAdmin
                            ? "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500 hover:text-white"
                            : "bg-muted/30 text-muted-foreground border-border hover:bg-foreground hover:text-background"
                        }`}
                      >
                        {u.isAdmin ? "REVOKE ADMIN" : "MAKE ADMIN"}
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateUser(u.id, "isPremium", u.isPremium)
                        }
                        className={`cursor-pointer text-[10px] font-black px-4 py-2 rounded-xl border transition-all flex-1 ${
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
                        className={`cursor-pointer text-[10px] font-black px-4 py-2 rounded-xl border transition-all flex-1 ${
                          u.isBanned
                            ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500 hover:text-white"
                            : "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500 hover:text-white"
                        }`}
                      >
                        {u.isBanned ? "UNBAN ACCESS" : "BAN USER"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isSearching && searchQuery && users.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <p className="text-4xl">🤷‍♂️</p>
                <p className="text-sm text-muted font-medium">
                  No users found matching "{searchQuery}"
                </p>
              </div>
            )}

            {!searchQuery && users.length === 0 && (
              <div className="text-center py-12 space-y-2 opacity-50">
                <p className="text-4xl">🔍</p>
                <p className="text-sm text-muted font-medium">
                  Search for a user to begin managing them.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
