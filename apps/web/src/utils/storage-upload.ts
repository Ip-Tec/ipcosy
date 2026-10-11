"use client";

import { uploadFiles } from "./uploadthing";

export async function uploadImage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) throw new Error("Choose a JPEG, PNG, GIF, or WebP image");
  if (file.size < 1 || file.size > 4 * 1024 * 1024) throw new Error("Images must be 4 MB or smaller");
  const configResponse = await fetch("/api/storage", { cache: "no-store" });
  if (!configResponse.ok) throw new Error("Uploads are temporarily unavailable");
  const config = await configResponse.json();
  if (config.provider === "uploadthing") {
    const uploaded = await uploadFiles("imageUploader", { files: [file] });
    if (!uploaded[0]?.url) throw new Error("Upload did not complete");
    return uploaded[0].url;
  }
  if (config.provider !== "b2") throw new Error("Uploads are temporarily unavailable");
  const response = await fetch("/api/storage", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: file.type, size: file.size }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Upload failed");
  const uploaded = await fetch(data.uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!uploaded.ok) throw new Error("Upload failed. Please try again");
  return new URL(data.fileUrl, window.location.origin).href;
}
