"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { attachmentLimitText } from "@/lib/attachment-info";

export function useAttachmentLimitText() {
  const { data: session, status } = useSession();
  const [isPremium, setIsPremium] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setIsPremium(false);
    void fetch("/api/storage", { cache: "no-store", signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("Unavailable"); return response.json(); })
      .then((config) => { if (!controller.signal.aborted) setIsPremium(config.isPremium === true); })
      .catch(() => {});
    return () => controller.abort();
  }, [status, session?.user?.id, session?.user?.isPremium]);
  return attachmentLimitText(isPremium);
}
