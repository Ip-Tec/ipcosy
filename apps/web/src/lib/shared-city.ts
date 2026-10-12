export type SharedCity = { city: string; country: string };
export function validateSharedCity(value: unknown): SharedCity | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid shared city");
  const item = value as Record<string, unknown>;
  if (Object.keys(item).some((key) => !["city", "country"].includes(key))) throw new Error("Only city and country may be shared");
  for (const key of ["city", "country"]) {
    const text = item[key];
    if (typeof text !== "string" || !text.trim() || text.length > 120 || /[\x00-\x1f\x7f]/.test(text)) throw new Error("Invalid shared city");
  }
  return { city: (item.city as string).trim(), country: (item.country as string).trim() };
}
export function locationSource(fingerprint?: string | null) {
  try { return JSON.parse(fingerprint || "{}").locationSource === "shared-city" ? "shared-city" : "network"; }
  catch { return "network"; }
}
