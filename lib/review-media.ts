import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const extensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

const maxFiles = 3;
const maxFileBytes = 10 * 1024 * 1024;

export async function saveReviewMedia(files: File[]) {
  const selectedFiles = files.filter((file) => file.size > 0).slice(0, maxFiles);
  const uploadDir = path.join(process.cwd(), "public", "uploads", "reviews");

  if (!selectedFiles.length) return [];

  await mkdir(uploadDir, { recursive: true });

  return Promise.all(
    selectedFiles.map(async (file) => {
      if (!allowedMimeTypes.has(file.type)) {
        throw new Error("Only image and video files are allowed.");
      }

      if (file.size > maxFileBytes) {
        throw new Error("Each review media file must be 10MB or smaller.");
      }

      const extension = extensionByMimeType[file.type] || "bin";
      const fileName = `${randomUUID()}.${extension}`;
      const bytes = Buffer.from(await file.arrayBuffer());

      await writeFile(path.join(uploadDir, fileName), bytes);
      return `/uploads/reviews/${fileName}`;
    })
  );
}
