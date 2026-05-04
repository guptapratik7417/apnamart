import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const allowedMimeTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/quicktime", "mov"],
]);

const maxFiles = 3;
const maxFileBytes = 10 * 1024 * 1024;

export async function saveSupportMedia(files: File[]) {
  const selectedFiles = files.filter((file) => file.size > 0).slice(0, maxFiles);
  if (!selectedFiles.length) return [];

  const uploadDir = path.join(process.cwd(), "public", "uploads", "support");
  await mkdir(uploadDir, { recursive: true });

  return Promise.all(
    selectedFiles.map(async (file) => {
      const extension = allowedMimeTypes.get(file.type);
      if (!extension) {
        throw new Error("Only image and video files are allowed.");
      }

      if (file.size > maxFileBytes) {
        throw new Error("Each support media file must be 10MB or smaller.");
      }

      const fileName = `${randomUUID()}.${extension}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(uploadDir, fileName), bytes);
      return `/uploads/support/${fileName}`;
    })
  );
}
