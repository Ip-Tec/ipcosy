"use client";
import { useEffect, useState } from "react";
import { Download, FileText } from "lucide-react";
import { attachmentInfo, formatFileSize } from "@/lib/attachment-info";
export function AttachmentPreview({ url }: { url: string }) {
  const file = attachmentInfo(url);
  const [details, setDetails] = useState<{ name: string; size: number } | null>(null);
  const infoUrl = file?.infoUrl;
  useEffect(() => {
    setDetails(null);
    if (!infoUrl) return;
    const controller = new AbortController();
    fetch(infoUrl, { signal: controller.signal }).then(async response => {
      if (!response.ok) return;
      const result = await response.json();
      if (typeof result.name === "string" && typeof result.size === "number" && !controller.signal.aborted) setDetails(result);
    }).catch(() => {});
    return () => controller.abort();
  }, [infoUrl]);
  if (!file) return <p className="p-3 text-sm">File unavailable</p>;
  const name = details?.name || file.name;
  const size = details?.size || file.size;
  return <div className="overflow-hidden rounded-xl border border-current/10">
    {file.image && <a href={file.url} target="_blank" rel="noopener noreferrer" aria-label={"Open " + name}>
      <img src={file.url} alt={name} loading="lazy" decoding="async" className="max-h-64 w-full object-contain bg-black/5" />
    </a>}
    <a href={file.downloadUrl} download={name} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 hover:bg-black/5 transition-colors" aria-label={"Download " + name}>
      <FileText className="h-5 w-5 shrink-0 opacity-70" />
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium" title={name}>{name}</span><span className="block text-xs opacity-70">{size ? formatFileSize(size) + " · " : ""}Download {file.image ? "image" : "file"}</span></span>
      <Download className="h-4 w-4 shrink-0" />
    </a>
  </div>;
}
