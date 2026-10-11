import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
const FILE_TYPES = new Set([...IMAGE_TYPES, "application/pdf", "application/octet-stream"]);

export function validateUpload(type: string, size: number) {
  if (!FILE_TYPES.has(type)) throw new Error("Unsupported file type");
  const limit = IMAGE_TYPES.has(type) ? 20 * 1024 * 1024 : 100 * 1024 * 1024;
  if (!Number.isSafeInteger(size) || size < 1 || size > limit) {
    throw new Error(IMAGE_TYPES.has(type) ? "Images must be 20 MB or smaller" : "Files must be 100 MB or smaller");
  }
}

export function storageEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.STORAGE_PROVIDER === "b2";
}

export function requireStorageConfig(env: NodeJS.ProcessEnv = process.env) {
  const required = ["B2_ENDPOINT", "B2_REGION", "B2_BUCKET", "B2_KEY_ID", "B2_APPLICATION_KEY", "STORAGE_TOKEN_SECRET"] as const;
  if (required.some((key) => !env[key])) {
    throw new Error("Storage is not configured");
  }
  const endpoint = new URL(env.B2_ENDPOINT!);
  if (endpoint.protocol !== "https:" || !/^s3\.[a-z0-9-]+\.backblazeb2\.com$/.test(endpoint.hostname) || endpoint.username || endpoint.password || endpoint.port || endpoint.search || endpoint.hash || endpoint.pathname !== "/") {
    throw new Error("Invalid storage endpoint");
  }
  if (env.STORAGE_TOKEN_SECRET!.length < 32) throw new Error("Storage token secret must be at least 32 characters");
  return {
    endpoint: endpoint.origin,
    region: env.B2_REGION!,
    bucket: env.B2_BUCKET!,
    credentials: { accessKeyId: env.B2_KEY_ID!, secretAccessKey: env.B2_APPLICATION_KEY! },
    secret: env.STORAGE_TOKEN_SECRET!,
  };
}

// Opaque per-file capability URLs, equivalent to existing UploadThing links.
// The bucket remains private; neither filenames nor sender identities are exposed.
export function encodeFileKey(key: string, secret: string) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), nonce);
  const encrypted = Buffer.concat([cipher.update(key, "utf8"), cipher.final()]);
  return Buffer.concat([nonce, cipher.getAuthTag(), encrypted]).toString("base64url");
}

export function decodeFileKey(token: string, secret: string) {
  if (!/^[A-Za-z0-9_-]{40,256}$/.test(token)) throw new Error("Invalid file link");
  const data = Buffer.from(token, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", createHash("sha256").update(secret).digest(), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  const key = Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8");
  if (!/^uploads\/[a-f0-9-]{36}$/.test(key)) throw new Error("Invalid file link");
  return key;
}

export function safeFileName(value: string) {
  return value.replace(/[\x00-\x1f\x7f/\\]/g, "").trim().slice(0, 160) || "file";
}
export function fileDisposition(name: string) {
  const safe = safeFileName(name);
  const fallback = safe.replace(/[^a-zA-Z0-9._ -]/g, "_");
  const encoded = encodeURIComponent(safe).replace(/['()*]/g, (char) => "%" + char.charCodeAt(0).toString(16).toUpperCase());
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}
