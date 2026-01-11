import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB" } }).onUploadComplete(
    async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata);
      console.log("file url", file.url);
      return { uploadedBy: "anonymous" };
    },
  ),

  fileUploader: f({
    pdf: { maxFileSize: "16MB" },
    blob: { maxFileSize: "16MB" },
  }).onUploadComplete(async ({ metadata, file }) => {
    console.log("Upload complete", file.url);
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
