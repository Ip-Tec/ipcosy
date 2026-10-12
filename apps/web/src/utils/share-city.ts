import type { SharedCity } from "@/lib/shared-city";

// Called only after the sender chooses to share and accepts browser permission.
export async function findDeviceCity(geolocation: Pick<Geolocation, "getCurrentPosition">, fetcher: typeof fetch = fetch, signal?: AbortSignal): Promise<SharedCity> {
  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    const abort = () => reject(new DOMException("Cancelled", "AbortError"));
    if (signal?.aborted) { abort(); return; }
    signal?.addEventListener("abort", abort, { once: true });
    geolocation.getCurrentPosition(
      (value) => { signal?.removeEventListener("abort", abort); resolve(value); },
      () => { signal?.removeEventListener("abort", abort); reject(new Error("Location wasn't available. Your message can still use a network estimate.")); },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    );
  });
  if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
  const { latitude, longitude, accuracy } = position.coords;
  if (![latitude, longitude, accuracy].every(Number.isFinite) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180 || accuracy < 0 || accuracy > 5000) {
    throw new Error("Your device location wasn't accurate enough. Your message can still use a network estimate.");
  }
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
  url.search = new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), localityLanguage: "en" }).toString();
  const response = await fetcher(url.href, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(8000)]) : AbortSignal.timeout(8000), credentials: "omit", referrerPolicy: "no-referrer" });
  if (!response.ok) throw new Error("City lookup is unavailable. Your message can still use a network estimate.");
  const data = await response.json();
  // Exclude addresses, suburbs, coordinates, IPs and other provider data.
  if (typeof data.city !== "string" || !data.city.trim() || typeof data.countryName !== "string" || !data.countryName.trim()) {
    throw new Error("No city was found. Your message can still use a network estimate.");
  }
  return { city: data.city.trim().slice(0, 120), country: data.countryName.trim().slice(0, 120) };
}
