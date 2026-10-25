"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

type IncomingNotification = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  chatId?: string | null;
  createdAt: string;
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const knownIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
      knownIds.current = null;
      return;
    }

    const controller = new AbortController();
    let running = false;
    const poll = async () => {
      if (running) return;
      running = true;
      try {
        const response = await fetch("/api/notifications", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const items = (await response.json()) as IncomingNotification[];
        if (controller.signal.aborted || !Array.isArray(items)) return;

        const previous = knownIds.current;
        const currentIds = new Set(items.map((item) => item.id));
        knownIds.current = currentIds;
        if (!previous) return; // Existing unread items are not new arrivals.

        for (const item of items.filter((candidate) => !previous.has(candidate.id)).reverse()) {
          const openChat = () => {
            void fetch("/api/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notificationId: item.id }) });
            if (item.chatId) window.dispatchEvent(new CustomEvent("ipcosy:open-chat", { detail: { chatId: item.chatId } }));
          };
          if (item.type !== "NEW_MESSAGE") continue;
          toast(item.title || "New message", {
            description: item.body || "You received a message.",
            duration: 8000,
            action: item.chatId
              ? { label: "Open", onClick: openChat }
              : undefined,
          });

          if ("Notification" in window && Notification.permission === "granted") {
            const notification = new Notification("IP~Cosy", {
              body: item.body || item.title || "You received a message.",
              icon: "/logo.png",
              tag: item.id,
              data: { chatId: item.chatId },
            });
            notification.onclick = () => {
              window.focus();
              openChat();
              notification.close();
            };
          }
        }
      } catch {
        // A temporary polling failure should not interrupt chat.
      } finally {
        running = false;
      }
    };

    void poll();
    const timer = window.setInterval(() => void poll(), 5000);
    const onVisible = () => { if (!document.hidden) void poll(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      controller.abort();
    };
  }, [session, status]);

  return <>{children}</>;
}


