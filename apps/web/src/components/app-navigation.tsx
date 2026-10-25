"use client";
import { useEffect } from "react";
import { needsDashboardEntry } from "@/lib/navigation-history";

export function AppNavigation() {
  useEffect(() => {
    const current = window.location;
    if (!needsDashboardEntry(current.pathname, current.search, document.referrer, current.origin, history.length) || history.state?.ipcosyBackSeeded) return;
    const url = current.pathname + current.search + current.hash;
    const state = { ...history.state, ipcosyBackSeeded: true };
    // Keep the current router entry intact; the plain dashboard entry reloads on Back.
    History.prototype.replaceState.call(history, { ipcosyDashboard: true }, "", "/");
    History.prototype.pushState.call(history, state, "", url);
    const restore = (event: PopStateEvent) => { if (event.state?.ipcosyDashboard) window.location.replace("/"); };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  return null;
}
