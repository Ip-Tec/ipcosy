"use client";
import { uploadFiles } from "./uploadthing";
import { validateAttachment } from "@/lib/attachment-info";
type UploadOptions = { signal?: AbortSignal; onProgress?: (progress: number) => void };
export async function uploadAttachment(file: File, options: UploadOptions = {}): Promise<string> {
  const type = validateAttachment(file);
  const configResponse = await fetch("/api/storage", { cache: "no-store", signal: options.signal });
  if (!configResponse.ok) throw new Error("Uploads are temporarily unavailable");
  const config = await configResponse.json();
  if (config.provider === "uploadthing") {
    if (file.size > (type.startsWith("image/") ? 4 : 16) * 1024 * 1024) throw new Error("Larger uploads are temporarily unavailable. Please try again later.");
    const uploaded = await uploadFiles(type.startsWith("image/") ? "imageUploader" : "fileUploader", { files: [file], signal: options.signal });
    if (!uploaded[0]?.url) throw new Error("Upload did not complete");
    return uploaded[0].url;
  }
  if (config.provider !== "b2") throw new Error("Uploads are temporarily unavailable");
  const response = await fetch("/api/storage", {
    method: "POST", headers: { "Content-Type": "application/json" }, signal: options.signal,
    body: JSON.stringify({ type, size: file.size, name: file.name }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Upload failed");
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    const clean = () => options.signal?.removeEventListener("abort", abort);
    xhr.open("PUT", data.uploadUrl);
    xhr.timeout = 10 * 60 * 1000;
    xhr.setRequestHeader("Content-Type", type);
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) options.onProgress?.(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => { clean(); xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed. Please try again.")); };
    xhr.onerror = () => { clean(); reject(new Error("Connection lost. Please try again.")); };
    xhr.ontimeout = () => { clean(); reject(new Error("Upload timed out. Please try again.")); };
    xhr.onabort = () => { clean(); reject(new DOMException("Upload cancelled", "AbortError")); };
    if (options.signal?.aborted) { reject(new DOMException("Upload cancelled", "AbortError")); return; }
    options.signal?.addEventListener("abort", abort, { once: true });
    xhr.send(file);
  });
  return new URL(data.fileUrl, window.location.origin).href;
}
export const uploadImage = uploadAttachment;
