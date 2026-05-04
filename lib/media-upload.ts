import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const exactMimeExtensions = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
  ["image/avif", "avif"],
  ["image/heic", "heic"],
  ["image/heif", "heif"],
  ["video/mp4", "mp4"],
  ["video/webm", "webm"],
  ["video/quicktime", "mov"],
  ["video/x-m4v", "m4v"],
]);

const imageExtensions = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "avif",
  "heic",
  "heif",
]);

const videoExtensions = new Set(["mp4", "webm", "mov", "m4v"]);
const allowedExtensions = new Set([...imageExtensions, ...videoExtensions]);
const maxFiles = 3;
const maxFileBytes = 10 * 1024 * 1024;

function getFileExtension(fileName: string) {
  const extension = path.extname(fileName).toLowerCase().replace(/^\./, "");
  return allowedExtensions.has(extension) ? extension : "";
}

function getExtensionFromMimeType(mimeType: string) {
  const exactExtension = exactMimeExtensions.get(mimeType);
  if (exactExtension) return exactExtension;

  if (!mimeType.startsWith("image/") && !mimeType.startsWith("video/")) {
    return "";
  }

  const subtype = mimeType.split("/")[1]?.split("+")[0]?.toLowerCase() || "";
  if (subtype === "svg") return "";
  if (subtype === "jpeg") return "jpg";
  if (allowedExtensions.has(subtype)) return subtype;

  return "";
}

function resolveMediaExtension(file: File) {
  const mimeType = file.type.toLowerCase();
  const fileExtension = getFileExtension(file.name);

  if (!mimeType || mimeType === "application/octet-stream") {
    return fileExtension;
  }

  if (mimeType.startsWith("image/")) {
    if (mimeType === "image/svg+xml") return "";
    return fileExtension && imageExtensions.has(fileExtension)
      ? fileExtension
      : getExtensionFromMimeType(mimeType);
  }

  if (mimeType.startsWith("video/")) {
    return fileExtension && videoExtensions.has(fileExtension)
      ? fileExtension
      : getExtensionFromMimeType(mimeType);
  }

  return "";
}

export async function saveMediaFiles(files: File[], folderName: string) {
  const selectedFiles = files.filter((file) => file.size > 0).slice(0, maxFiles);
  if (!selectedFiles.length) return [];

  const uploadDir = path.join(process.cwd(), "public", "uploads", folderName);
  await mkdir(uploadDir, { recursive: true });

  return Promise.all(
    selectedFiles.map(async (file) => {
      const extension = resolveMediaExtension(file);
      if (!extension) {
        throw new Error("Only image and video files are allowed.");
      }

      if (file.size > maxFileBytes) {
        throw new Error("Each media file must be 10MB or smaller.");
      }

      const fileName = `${randomUUID()}.${extension}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(uploadDir, fileName), bytes);
      return `/uploads/${folderName}/${fileName}`;
    })
  );
}
