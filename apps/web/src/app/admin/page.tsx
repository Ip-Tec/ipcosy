import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";

const ADMIN_EMAILS = ["iptecdev@gmail.com", "otakhorpeter@gmail.com"]; // Fallback legacy check
export default function AdminPage() {
  const { data: session, status } = useSession();
  const [price, setPrice] = useState(450);
  const [isSaving, setIsSaving] = useState(false);

  // User Management State
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const user = session?.user as any;
  const isAdmin =
    user?.isAdmin || (user?.email && ADMIN_EMAILS.includes(user.email));

  useEffect(() => {
    fetch("/api/admin/config")
      .then((res) => res.json())
      .then((data) => {
        if (data.premiumPrice) setPrice(data.premiumPrice);
      });
  }, []);

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

  const handleToggleAdmin = async (
    targetUserId: string,
    currentStatus: boolean,
  ) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: targetUserId, isAdmin: !currentStatus }),
      });
      if (res.ok) {
        toast.success("User admin status updated!");
        // Update local state
        setUsers((prev) =>
          prev.map((u) =>
            u.id === targetUserId ? { ...u, isAdmin: !currentStatus } : u,
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

  if (status === "loading") return <div className="p-8">Loading...</div>;

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

      <div className="grid md:grid-cols-2 gap-8">
        {/* Price Management */}
        <section className="bg-sidebar rounded-[2rem] border border-border p-8 shadow-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Premium Pricing</h2>
            <p className="text-xs text-muted">Manage the subscription cost.</p>
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
              className="w-full bg-primary text-white py-4 rounded-2xl font-black hover:opacity-90 disabled:opacity-50 transition-all shadow-lg active:scale-95"
            >
              {isSaving ? "Saving..." : "Update Price"}
            </button>
          </div>
        </section>

        {/* User Management Search */}
        <section className="bg-sidebar rounded-[2rem] border border-border p-8 shadow-2xl space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold">Manage Admins</h2>
            <p className="text-xs text-muted">
              Grant or revoke admin privileges.
            </p>
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
                className="bg-foreground text-background px-4 rounded-xl font-bold text-sm hover:opacity-90"
              >
                🔍
              </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {isSearching && (
                <p className="text-center text-xs text-muted animate-pulse">
                  Searching...
                </p>
              )}
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border group hover:border-primary/30 transition-all"
                >
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-primary/10 border border-primary/20">
                    {u.image ? (
                      <img
                        src={u.image}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-xs">
                        {u.name?.substring(0, 1)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs truncate">{u.name}</p>
                    <p className="text-[10px] text-muted truncate">{u.email}</p>
                  </div>
                  <button
                    onClick={() => handleToggleAdmin(u.id, u.isAdmin)}
                    className={`text-[10px] font-black px-3 py-1.5 rounded-lg border transition-all ${
                      u.isAdmin
                        ? "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500 hover:text-white"
                        : "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500 hover:text-white"
                    }`}
                  >
                    {u.isAdmin ? "REVOKE" : "GRANT"}
                  </button>
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
