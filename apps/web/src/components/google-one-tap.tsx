"use client";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { X } from "lucide-react";
import { toast } from "sonner";

type IdentityAPI = {
  initialize: (options: { client_id: string; nonce: string; callback: (response: { credential: string }) => void; auto_select: boolean; use_fedcm_for_prompt: boolean; cancel_on_tap_outside: boolean }) => void;
  prompt: () => void; cancel: () => void;
  renderButton: (element: HTMLElement, options: { theme: string; size: string; text: string; width: number }) => void;
};
declare global { interface Window { google?: { accounts?: { id?: IdentityAPI } } } }
export function GoogleOneTap() {
  const { status, update } = useSession();
  const [config, setConfig] = useState<{ clientId: string; nonce: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const button = useRef<HTMLDivElement>(null);
  const initializing = useRef(false);
  useEffect(() => {
    if (status !== "unauthenticated") { window.google?.accounts?.id?.cancel(); return; }
    try { if (sessionStorage.getItem("ipcosy-google-dismissed")) { setDismissed(true); return; } } catch { /* Prompt remains optional. */ }
    const controller = new AbortController();
    void fetch("/api/google-one-tap", { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? response.json() : null)
      .then((value) => { if (!controller.signal.aborted && value?.enabled) setConfig(value); })
      .catch(() => {});
    return () => controller.abort();
  }, [status]);
  useEffect(() => {
    if (!ready || !config || dismissed || status !== "unauthenticated" || !button.current || initializing.current) return;
    const api = window.google?.accounts?.id; if (!api) return;
    initializing.current = true;
    api.initialize({ client_id: config.clientId, nonce: config.nonce, auto_select: false, use_fedcm_for_prompt: true, cancel_on_tap_outside: true,
      callback: async ({ credential }) => {
        try {
          const response = await fetch("/api/google-one-tap", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ credential }) });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Sign-in failed");
          await update(); toast.success("Signed in with Google");
        } catch (error) { toast.error(error instanceof Error ? error.message : "You can still use the site without signing in"); }
      },
    });
    api.renderButton(button.current, { theme: "outline", size: "large", text: "continue_with", width: 250 });
    api.prompt();
    return () => { api.cancel(); initializing.current = false; };
  }, [ready, config, dismissed, status, update]);
  if (status !== "unauthenticated" || dismissed || !config) return null;
  return <>
    <Script id="ipcosy-google-sdk" src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setReady(true)} onError={() => setReady(false)} />
    <aside aria-label="Optional Google sign-in" className="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-sidebar p-4 text-foreground shadow-lg">
      <button type="button" aria-label="Dismiss Google sign-in" className="absolute right-2 top-2 rounded p-2" onClick={() => { try { sessionStorage.setItem("ipcosy-google-dismissed", "1"); } catch {} setDismissed(true); window.google?.accounts?.id?.cancel(); }}><X className="h-4 w-4" /></button>
      <p className="mb-2 pr-8 text-sm font-semibold">Save your chats with Google</p>
      <div ref={button} />
      {!ready && <button type="button" onClick={() => void signIn("google", { callbackUrl: window.location.href })} className="rounded-xl bg-primary px-4 py-2 text-sm text-white">Continue with Google</button>}
      <p className="mt-2 max-w-[250px] text-xs text-muted-foreground">Optional. You can keep using IPCosy without signing in. Google shares your profile with IPCosy; anonymous messages stay anonymous.</p>
    </aside>
  </>;
}
