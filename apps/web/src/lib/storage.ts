import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { decodeFileKey, encodeFileKey, requireStorageConfig, validateUpload, safeFileName, fileDisposition } from "./storage-policy";

function client() {
  const config = requireStorageConfig();
  return { config, s3: new S3Client({ ...config, forcePathStyle: true, requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" }) };
}

export async function prepareUpload(type: string, size: number, name?: string) {
  validateUpload(type, size);
  const { config, s3 } = client();
  const key = `uploads/${randomUUID()}`;
  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
    Bucket: config.bucket, Key: key, ContentType: type, ContentLength: size,
    ...(name ? { Metadata: { filename: Buffer.from(safeFileName(name), "utf8").toString("base64url") } } : {}),
  }), { expiresIn: 300, signableHeaders: new Set(["content-type", "content-length"]) });
  const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp", "application/pdf": "pdf", "application/octet-stream": "bin" } as Record<string, string>)[type];
  return { uploadUrl, fileUrl: `/api/storage/file/${encodeFileKey(key, config.secret)}.${extension}` };
}

export async function attachmentDetails(token: string) {
  const { config, s3 } = client();
  const key = decodeFileKey(token.replace(/\.(jpg|png|gif|webp|pdf|bin)$/, ""), config.secret);
  const head = await s3.send(new HeadObjectCommand({ Bucket: config.bucket, Key: key }));
  const name = head.Metadata?.filename ? safeFileName(Buffer.from(head.Metadata.filename, "base64url").toString("utf8")) : (/\.(pdf|bin)$/.test(token) ? "File" : "Image");
  return { name, size: head.ContentLength || 0 };
}

export async function prepareDownload(token: string, download = false) {
  const { config, s3 } = client();
  const key = decodeFileKey(token.replace(/\.(jpg|png|gif|webp|pdf|bin)$/, ""), config.secret);
  const attachment = download || /\.(pdf|bin)$/.test(token);
  const details = attachment ? await attachmentDetails(token) : null;
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: config.bucket, Key: key,
    ...(details ? { ResponseContentDisposition: fileDisposition(details.name), ResponseContentType: "application/octet-stream" } : {}),
  }), { expiresIn: 60 });
}
