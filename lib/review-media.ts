import { saveMediaFiles } from "@/lib/media-upload";

export async function saveReviewMedia(files: File[]) {
  return saveMediaFiles(files, "reviews");
}
