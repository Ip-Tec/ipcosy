export const IMAGE_LIMIT = 20 * 1024 * 1024;
export const FILE_LIMIT = 100 * 1024 * 1024;
export const ATTACHMENT_LIMIT_TEXT = "Images up to 20 MB · Other files up to 100 MB";
const imageTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
export function uploadType(type: string) {
  return imageTypes.has(type) || type === "application/pdf" ? type : "application/octet-stream";
}
export function validateAttachment(file: { type: string; size: number }) {
  const type = uploadType(file.type);
  const limit = imageTypes.has(type) ? IMAGE_LIMIT : FILE_LIMIT;
  if (!Number.isSafeInteger(file.size) || file.size < 1) throw new Error("Choose a file that isn't empty");
  if (file.size > limit) throw new Error(imageTypes.has(type) ? "Images must be 20 MB or smaller" : "Files must be 100 MB or smaller");
  return type;
}
export function formatFileSize(size: number) {
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + " KB";
  return (size / (1024 * 1024)).toFixed(1) + " MB";
}
export function attachmentInfo(value: string) {
  try {
    const url = new URL(value, "https://ipcosy.vercel.app");
    if (!["https:", "http:"].includes(url.protocol)) return null;
    const image = /\.(jpg|jpeg|png|gif|webp)$/i.test(url.pathname);
    const name = url.searchParams.get("name") || (image ? "Image" : "File");
    const size = Number(url.searchParams.get("size"));
    const download = new URL(url);
    if (url.pathname.startsWith("/api/storage/file/")) download.searchParams.set("download", "1");
    return { url: url.href, downloadUrl: download.href, infoUrl: url.pathname.startsWith("/api/storage/file/") ? url.origin + "/api/storage/info/" + url.pathname.split("/").pop() : null, image, name, size: Number.isFinite(size) && size > 0 ? size : null };
  } catch { return null; }
}
