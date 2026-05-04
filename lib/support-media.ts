import { saveMediaFiles } from "@/lib/media-upload";

export async function saveSupportMedia(files: File[]) {
  return saveMediaFiles(files, "support");
}
