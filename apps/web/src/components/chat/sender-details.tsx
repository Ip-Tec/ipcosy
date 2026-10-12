"use client";
import { useState } from "react";
import { ShieldIcon } from "lucide-react";

type SenderMetadata = { deviceType?: string | null; deviceOS?: string | null; browser?: string | null; city?: string | null; country?: string | null };
export function SenderDetails({ metadata }: { metadata?: SenderMetadata | null }) {
  const [open, setOpen] = useState(false);
  if (!metadata) return null;
  const location = [metadata.city, metadata.country].filter((value) => value && value !== "Unknown").join(", ") || "Unknown";
  return <div className="mt-2 w-full">
    <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-center gap-2 py-2 text-[10px] font-bold text-muted-foreground hover:text-primary">
      <ShieldIcon className="h-3 w-3" />{open ? "Hide Sender Data" : "View Sender Data (Premium)"}
    </button>
    {open && <div className="space-y-2 rounded-2xl border border-border/50 bg-sidebar p-4 text-[10px] text-foreground">
      {[["Device Type", metadata.deviceType], ["OS / System", metadata.deviceOS], ["Browser", metadata.browser], ["Location", location]].map(([label, value]) =>
        <div key={label} className="flex justify-between gap-3"><span className="font-bold">{label}</span><span>{value || "Unknown"}</span></div>)}
      <p className="text-muted-foreground">Location is approximate. VPNs and browser settings can affect these clues. Older messages may have no saved details.</p>
    </div>}
  </div>;
}
