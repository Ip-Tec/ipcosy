"use client";
import { useEffect, useRef, useState } from "react";
import { Paperclip, X, RotateCcw } from "lucide-react";
import { uploadAttachment } from "@/utils/storage-upload";
import { ATTACHMENT_LIMIT_TEXT, formatFileSize } from "@/lib/attachment-info";
export function AttachmentPicker({ onUploaded, compact = false, disabled = false, onBusyChange }: { onUploaded: (url: string) => void; compact?: boolean; disabled?: boolean; onBusyChange?: (busy: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  const startUpload = async (selected: File) => {
    if (uploading) return;
    const active = new AbortController(); controller.current = active;
    setFile(selected); setError(""); setProgress(0); setUploading(true); onBusyChange?.(true);
    try {
      const url = await uploadAttachment(selected, { signal: active.signal, onProgress: (value) => { if (mounted.current) setProgress(value); } });
      if (mounted.current && !active.signal.aborted) { onUploaded(url); setFile(null); }
    } catch (problem) {
      if (mounted.current) {
        if (active.signal.aborted) { setFile(null); setError(""); }
        else setError(problem instanceof Error ? problem.message : "Upload failed. Please try again.");
      }
    } finally { if (mounted.current) { setUploading(false); onBusyChange?.(false); } }
  };
  return <div className={compact ? "relative shrink-0" : "w-full"}>
    <input ref={input} type="file" className="hidden" onChange={(event) => { const selected = event.target.files?.[0]; event.target.value = ""; if (selected) void startUpload(selected); }} disabled={uploading || disabled} />
    <button type="button" disabled={uploading || disabled} onClick={() => input.current?.click()} aria-label="Attach image or file" title={ATTACHMENT_LIMIT_TEXT} className={compact ? "rounded-full p-2 hover:bg-primary/10 disabled:opacity-40" : "flex w-full items-center justify-center gap-2 rounded-2xl bg-primary/10 py-3 font-semibold text-primary hover:bg-primary/20 disabled:opacity-40"}>
      <Paperclip className="h-5 w-5" />{!compact && (uploading ? "Uploading…" : "Attach image or file")}
    </button>
    {!compact && <p className="mt-2 text-center text-xs text-muted-foreground">{ATTACHMENT_LIMIT_TEXT}</p>}
    {file && <div className={compact ? "absolute bottom-full left-0 z-30 mb-3 w-72 max-w-[85vw] rounded-xl border border-border bg-sidebar p-3 text-foreground shadow-lg" : "mt-3 rounded-xl border border-border p-3"} role="status" aria-live="polite">
      <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium" title={file.name}>{file.name}</p><p className="text-xs text-muted-foreground">{formatFileSize(file.size)}{uploading ? " · Uploading " + progress + "%" : ""}</p></div>
        <button type="button" aria-label={uploading ? "Cancel upload" : "Dismiss upload"} onClick={() => { controller.current?.abort(); if (!uploading) { setFile(null); setError(""); } }} className="rounded p-1 hover:bg-primary/10"><X className="h-4 w-4" /></button>
      </div>
      {uploading && <progress value={progress} max={100} className="mt-2 h-2 w-full accent-primary" aria-label="Upload progress" />}
      {error && <><p className="mt-2 text-xs text-red-600">{error}</p><button type="button" onClick={() => void startUpload(file)} className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary"><RotateCcw className="h-3 w-3" />Try again</button></>}
    </div>}
  </div>;
}
