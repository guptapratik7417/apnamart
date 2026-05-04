import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const maxImageBytes = 10 * 1024 * 1024;
const allowedTypes = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export async function saveAdminImage(file: File, folder = "general") {
  if (!file.size) throw new Error("Image file is empty.");
  if (file.size > maxImageBytes) {
    throw new Error("Each image file must be 10MB or smaller.");
  }

  const extension = allowedTypes.get(file.type);
  if (!extension) {
    throw new Error("Only JPG, PNG, WEBP, and GIF images are supported.");
  }

  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "general";
  const uploadDir = path.join(
    process.cwd(),
    "public",
    "uploads",
    "admin",
    safeFolder
  );
  await mkdir(uploadDir, { recursive: true });

  const fileName = `${randomUUID()}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fileName), bytes);

  return `/uploads/admin/${safeFolder}/${fileName}`;
}
