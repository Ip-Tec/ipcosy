export const IMAGE_LIMIT = 4 * 1024 * 1024;
export const FILE_LIMIT = 16 * 1024 * 1024;
export function attachmentLimitText(isPremium = false) {
  return isPremium ? "Premium: images up to 20 MB · Other files up to 100 MB" : "Images up to 4 MB · Other files up to 16 MB · Premium: 20 MB / 100 MB";
}
const imageTypes = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
export function uploadType(type: string) {
  return imageTypes.has(type) || type === "application/pdf" ? type : "application/octet-stream";
}
export function validateAttachment(file: { type: string; size: number }, isPremium = false) {
  const type = uploadType(file.type);
  const limit = imageTypes.has(type) ? (isPremium ? 20 * 1024 * 1024 : IMAGE_LIMIT) : (isPremium ? 100 * 1024 * 1024 : FILE_LIMIT);
  if (!Number.isSafeInteger(file.size) || file.size < 1) throw new Error("Choose a file that isn't empty");
  if (file.size > limit) throw new Error(`${imageTypes.has(type) ? "Images" : "Files"} must be ${limit / (1024 * 1024)} MB or smaller${isPremium ? "" : ". Upgrade to Premium for larger uploads"}`);
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
