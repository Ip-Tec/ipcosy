"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface OnboardingModalProps {
  user: {
    username?: string;
    isPremium?: boolean;
    name?: string;
  };
  forceOpen?: boolean;
}

export function OnboardingModal({
  user,
  forceOpen = false,
}: OnboardingModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Show modal if user has no username
    if (forceOpen || !user.username) {
      setIsOpen(true);
      setUsername(user.username || "");
    }
  }, [user.username, forceOpen]);

  const handleSubmit = async () => {
    if (username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/user/username", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update username");
      }

      toast.success("Welcome, " + username + "!");
      setIsOpen(false);
      router.refresh();
      window.location.reload(); // Force reload to ensure session/sidebar updates immediately
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[2rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-2xl space-y-6 animate-in zoom-in duration-300">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-3xl">
            👋
          </div>
          <h2 className="text-2xl font-black">Choose your identity</h2>
          <p className="text-sm text-muted-foreground">
            Pick a unique username to start receiving anonymous messages.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Username
            </label>
            <input
              type="text"
              placeholder="e.g. ghost_rider"
              value={username}
              onChange={(e) =>
                setUsername(
                  e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                )
              }
              className="w-full bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
            />
            <p className="text-[10px] text-muted-foreground">
              ipcosy.vercel.app/{username || "..."}
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading || username.length < 3}
            className="w-full bg-primary text-white font-bold py-4 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : "Start Messaging"}
          </button>
        </div>
      </div>
    </div>
  );
}
