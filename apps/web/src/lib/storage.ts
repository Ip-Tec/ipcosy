import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { decodeFileKey, encodeFileKey, requireStorageConfig, validateUpload } from "./storage-policy";

function client() {
  const config = requireStorageConfig();
  return { config, s3: new S3Client({ ...config, forcePathStyle: true, requestChecksumCalculation: "WHEN_REQUIRED", responseChecksumValidation: "WHEN_REQUIRED" }) };
}

export async function prepareUpload(type: string, size: number) {
  validateUpload(type, size);
  const { config, s3 } = client();
  const key = `uploads/${randomUUID()}`;
  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({
    Bucket: config.bucket, Key: key, ContentType: type, ContentLength: size,
  }), { expiresIn: 60, signableHeaders: new Set(["content-type", "content-length"]) });
  const extension = ({ "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "image/webp": "webp", "application/pdf": "pdf", "application/octet-stream": "bin" } as Record<string, string>)[type];
  return { uploadUrl, fileUrl: `/api/storage/file/${encodeFileKey(key, config.secret)}.${extension}` };
}

export async function prepareDownload(token: string) {
  const { config, s3 } = client();
  const key = decodeFileKey(token.replace(/\.(jpg|png|gif|webp|pdf|bin)$/, ""), config.secret);
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: config.bucket, Key: key }), { expiresIn: 60 });
}
