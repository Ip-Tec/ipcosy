"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, X } from "lucide-react";
import type { SharedCity } from "@/lib/shared-city";
import { findDeviceCity } from "@/utils/share-city";
import { readCityPreference, writeCityPreference, type CityPreference } from "@/lib/city-preference";

export function CitySharing({ value, onChange, disabled = false, onBusyChange }: { value: SharedCity | null; onChange: (city: SharedCity | null) => void; disabled?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preference, setPreference] = useState<CityPreference>("ask");
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  const locating = useRef(false);
  const locate = useCallback(async () => {
    if (locating.current) return;
    if (!navigator.geolocation) { setError("Location isn't supported here. You can still send your message."); return; }
    const active = new AbortController(); controller.current = active;
    locating.current = true;
    setBusy(true); onBusyChange?.(true); setError("");
    try {
      const city = await findDeviceCity(navigator.geolocation, fetch, active.signal);
      if (mounted.current && !active.signal.aborted) { onChange(city); setExpanded(false); }
    } catch (problem) {
      if (mounted.current && !active.signal.aborted) setError(problem instanceof Error ? problem.message : "City lookup failed. You can still send your message.");
    } finally { locating.current = false; if (mounted.current) { setBusy(false); onBusyChange?.(false); } }
  }, [onChange, onBusyChange]);
  useEffect(() => {
    const saved = readCityPreference(localStorage); setPreference(saved); setExpanded(saved === "ask");
    if (saved === "on") void locate();
  }, [locate]);
  const turnOff = () => { writeCityPreference(localStorage, "off"); setPreference("off"); controller.current?.abort(); onChange(null); setExpanded(false); setError(""); };
  return <div className="text-xs text-muted-foreground">
    {value ? <div className="flex items-center justify-center gap-2"><MapPin className="h-3 w-3" /><span>City sharing on: {value.city}, {value.country}</span><button type="button" onClick={turnOff} disabled={disabled} aria-label="Turn off city sharing" className="rounded p-2"><X className="h-3 w-3" /></button></div> :
      <div className="flex items-center justify-center gap-2"><button type="button" disabled={disabled} aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 rounded-lg px-3 py-2 font-medium text-primary"><MapPin className="h-3 w-3" />{preference === "off" ? "City sharing off" : preference === "on" ? "City sharing on" : "Share my city (optional)"}</button>{preference === "on" && <button type="button" onClick={turnOff} disabled={disabled} className="rounded-lg px-3 py-2">Turn off</button>}</div>}
    {expanded && !value && <div className="mx-auto max-w-md space-y-2 rounded-xl border border-border bg-sidebar p-3 text-foreground">
      <p>Share your city and country with paid recipients. Once allowed, city sharing stays on for future messages and visits until you turn it off. Your browser will ask for location permission.</p>
      <p className="text-muted-foreground">BigDataCloud receives your device coordinates and IP address to find your city and improve its location data. IPCosy receives only the city and country, not your device coordinates. <a href="https://www.bigdatacloud.com/privacy-and-cookie-policy" target="_blank" rel="noopener noreferrer" className="underline">Lookup privacy</a></p>
      <div className="flex justify-center gap-3"><button type="button" onClick={() => { writeCityPreference(localStorage, "on"); setPreference("on"); void locate(); }} disabled={busy || disabled} className="rounded-lg bg-primary px-3 py-2 text-white">{busy ? "Finding city…" : "Allow city sharing"}</button><button type="button" onClick={turnOff} className="rounded-lg px-3 py-2">{busy ? "Cancel" : "Keep network estimate"}</button></div>
      {error && <p role="status" className="text-red-600">{error}</p>}
    </div>}
  </div>;
}
