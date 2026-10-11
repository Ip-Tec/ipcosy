# IPCosy storage expansion (Backblaze B2)

The optional B2 integration sends new image uploads from profile links and chats to a private Backblaze bucket. Existing UploadThing URLs remain valid. The MySQL database and message retention policy are unchanged.

## Account setup before activation

Backblaze includes the first 10 GB free across the account. Verify existing account usage first. Set storage and supported transaction spending caps to $0 in Caps & Alerts. Do not add a paid plan. Free storage is finite; uploads/downloads can stop when free allowances are exhausted. Do not enable Class D features such as event notifications, which have no spending cap.

1. Sign in or create an account (the owner completes account terms and credential entry).
2. Create a PRIVATE bucket for IPCosy. Do not enable public access.
3. Create a bucket-scoped application key with readFiles and writeFiles access. Never place credentials in NEXT_PUBLIC variables or commit them.
4. Configure CORS to allow PUT, GET, and HEAD from https://ipcosy.vercel.app, with Content-Type and Content-Length headers. Add the exact preview origin only when testing that preview; do not use a wildcard origin.
5. Use a lifecycle rule that keeps only the current object version. Upload authorizations expire in 60 seconds, but reusing an authorization may create versions.

## Server environment variables

- STORAGE_PROVIDER=b2 (set this last, after preview tests pass)
- B2_ENDPOINT=https://s3.<region>.backblazeb2.com
- B2_REGION=<region>
- B2_BUCKET=<private bucket name>
- B2_KEY_ID=<bucket-scoped key id>
- B2_APPLICATION_KEY=<bucket-scoped key secret>
- STORAGE_TOKEN_SECRET=<random secret of at least 32 characters; preserve this permanently for existing B2 links>

No database migration is needed. Image size limits remain 20 MB. The existing UploadThing uploader stays in place as the default until STORAGE_PROVIDER=b2 is set.

## Verification

- Run node --experimental-strip-types --test apps/web/tests/storage-policy.test.mjs.
- Generate Prisma client and run the web build. Do not apply database migrations.
- In a configured preview, send a small image through a real test profile and a chat. Confirm the file is stored in B2 and opens after reload.
- Confirm an oversized image and an unsupported type are rejected, and an altered file link cannot be opened.
- Open an existing UploadThing message to verify backwards compatibility.
- Verify a new B2 upload does not increase UploadThing usage.
- Test production after activation using a test conversation approved by the owner.

## Rollback

Remove STORAGE_PROVIDER or set it to uploadthing, then redeploy. Retain B2 credentials and STORAGE_TOKEN_SECRET: existing B2 links still require them to be readable.

## Privacy

The bucket is private. The app stores an opaque encrypted per-file link and exchanges it for a short-lived signed download URL. Anyone with a complete app file link can open it, matching the capability-link behavior of existing UploadThing files. This is not end-to-end message encryption. Files do not automatically expire or get removed when a message is deleted; the existing retention behavior is unchanged.

## Status

Implementation is prepared locally. Account provisioning, live upload tests, and production activation require the owner's Backblaze account access. Do not claim total capacity has increased until that is verified.

Sources:
- https://www.backblaze.com/cloud-storage/pricing
- https://www.backblaze.com/docs/cloud-storage-create-and-manage-caps-and-alerts
- https://www.backblaze.com/docs/cloud-storage-s3-compatible-api
- https://www.backblaze.com/docs/cloud-storage-cross-origin-resource-sharing-rules

## Verified account setup (2026-10-11)

A private encrypted B2 bucket was created in `us-east-005`. The account dashboard showed a zero-dollar storage cap and a 10 GB allowance. The six storage configuration variables were saved as Vercel Secrets for Preview and Production; the provider flag was verified for Preview only.

A live test using the application storage implementation passed: signed image PUT and GET returned 200, downloaded bytes matched, unsigned access returned 401, invalid links were rejected, and production-origin CORS preflight succeeded. Exact production and branch-preview origins were configured.

Deployed application upload/message verification and production activation remain pending; the local storage test does not establish that the production deployment uses B2.

## Larger attachments

JPEG, PNG, GIF and WebP images can be up to 20 MB. Other files can be up to 100 MB and are downloaded as attachments instead of rendered as active content. The original filename is stored in private B2 object metadata, keeping message links within the existing database field length. No database migration is required. Uploads have progress, cancellation, retry and a preview before sending. The UploadThing rollback retains its original 4 MB image / 16 MB file limits.
