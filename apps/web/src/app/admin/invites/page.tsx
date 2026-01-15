"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminInvitesPage() {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  useEffect(() => {
    fetch("/api/admin/invites")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setInvites(data);
      })
      .catch(() => toast.error("Failed to load invites"))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black">Invite Codes</h1>
        <p className="text-muted">Generate and manage public access keys.</p>
      </div>

      <section className="bg-sidebar rounded-[2rem] border border-border p-8 shadow-2xl space-y-6">
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Active Invites</h2>
              <p className="text-xs text-muted">
                Codes valid for registration.
              </p>
            </div>
            <button
              onClick={handleGenerateInvite}
              disabled={isGeneratingInvite}
              className="cursor-pointer bg-primary text-white text-xs font-black px-6 py-3 rounded-xl hover:opacity-90 active:scale-95 disabled:opacity-50 transition-all shadow-lg hover:shadow-primary/20"
            >
              {isGeneratingInvite ? "Generating..." : "+ NEW INVITE CODE"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {loading && (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          )}

          {!loading && invites.length === 0 && (
            <div className="text-center py-12 rounded-2xl bg-background/50 border border-dashed border-border">
              <p className="text-4xl mb-2">🎫</p>
              <p className="text-sm text-muted font-bold">
                No active invite codes found.
              </p>
              <p className="text-xs text-muted">
                Generate one to allow new users to join.
              </p>
            </div>
          )}

          {!loading &&
            invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-4 bg-background rounded-xl border border-border group hover:border-primary/30 transition-all"
              >
                <div className="min-w-0 flex items-center gap-4">
                  <div className="h-10 w-10 flex items-center justify-center bg-primary/10 rounded-lg text-primary font-bold">
                    🔑
                  </div>
                  <div>
                    <p className="font-mono font-black text-lg text-foreground tracking-widest whitespace-nowrap">
                      {invite.code}
                    </p>
                    <p className="text-[10px] text-muted font-bold uppercase flex items-center gap-2">
                      <span>
                        Expires:{" "}
                        {new Date(invite.expiresAt).toLocaleDateString()}
                      </span>
                      {/* Status Valid Check mock */}
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteInvite(invite.id)}
                  className="p-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                  title="Revoke Invite"
                >
                  🗑️
                </button>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
