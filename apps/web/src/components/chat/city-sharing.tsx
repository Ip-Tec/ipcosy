"use client";
import { useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import type { SharedCity } from "@/lib/shared-city";
import { findDeviceCity } from "@/utils/share-city";

export function CitySharing({ value, onChange, disabled = false, onBusyChange }: { value: SharedCity | null; onChange: (city: SharedCity | null) => void; disabled?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  const locate = async () => {
    if (busy) return;
    if (!navigator.geolocation) { setError("Location isn't supported here. You can still send your message."); return; }
    const active = new AbortController(); controller.current = active;
    setBusy(true); onBusyChange?.(true); setError("");
    try {
      const city = await findDeviceCity(navigator.geolocation, fetch, active.signal);
      if (mounted.current && !active.signal.aborted) { onChange(city); setExpanded(false); }
    } catch (problem) {
      if (mounted.current && !active.signal.aborted) setError(problem instanceof Error ? problem.message : "City lookup failed. You can still send your message.");
    } finally { if (mounted.current) { setBusy(false); onBusyChange?.(false); } }
  };
  return <div className="text-xs text-muted-foreground">
    {value ? <div className="flex items-center justify-center gap-2"><MapPin className="h-3 w-3" /><span>City to share: {value.city}, {value.country}</span><button type="button" onClick={() => onChange(null)} disabled={disabled} aria-label="Remove shared city" className="rounded p-2"><X className="h-3 w-3" /></button></div> :
      <button type="button" disabled={disabled} aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="mx-auto flex items-center gap-1 rounded-lg px-3 py-2 font-medium text-primary"><MapPin className="h-3 w-3" />Share my city (optional)</button>}
    {expanded && !value && <div className="mx-auto max-w-md space-y-2 rounded-xl border border-border bg-sidebar p-3 text-foreground">
      <p>Share your city and country with paid recipients of this message. Your browser will ask for location permission.</p>
      <p className="text-muted-foreground">BigDataCloud receives your device coordinates and IP address to find your city and improve its location data. IPCosy receives only the city and country, not your device coordinates. <a href="https://www.bigdatacloud.com/privacy-and-cookie-policy" target="_blank" rel="noopener noreferrer" className="underline">Lookup privacy</a></p>
      <div className="flex justify-center gap-3"><button type="button" onClick={() => void locate()} disabled={busy || disabled} className="rounded-lg bg-primary px-3 py-2 text-white">{busy ? "Finding city…" : "Use my location"}</button><button type="button" onClick={() => { controller.current?.abort(); setExpanded(false); setError(""); }} className="rounded-lg px-3 py-2">{busy ? "Cancel" : "Keep network estimate"}</button></div>
      {error && <p role="status" className="text-red-600">{error}</p>}
    </div>}
  </div>;
}
