"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ("Notification" in window && permission === "default") {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast.success("Notifications enabled!");
      } else if (result === "denied") {
        toast.error("Notifications blocked");
      }
    }
  };

  // Auto-request on mount for authenticated users
  useEffect(() => {
    if (session && permission === "default") {
      // Small delay to not overwhelm user on login
      const timer = setTimeout(() => {
        requestPermission();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [session, permission]);

  return <>{children}</>;
}
