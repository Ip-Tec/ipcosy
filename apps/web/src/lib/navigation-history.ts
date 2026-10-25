export function needsDashboardEntry(path: string, search: string, referrer: string, origin: string, length: number) {
  const params = new URLSearchParams(search);
  if (path === "/" && !params.has("chat") && !params.has("join")) return false;
  try { if (length > 1 && referrer && new URL(referrer).origin === origin) return false; } catch { /* External or unavailable referrer. */ }
  return true;
}
