import { apiClient } from "@/lib/api/client";
import { parseApiResponse } from "@/lib/api/errors";
import type { MediaUploadMultipleResult, MediaUploadResult } from "@/types/api";

const MAX_IMAGES_PER_UPLOAD = 20;

function appendLocalImage(form: FormData, fieldName: string, localUri: string) {
  const filename = localUri.split("/").pop() ?? "photo.jpg";
  const extension = filename.split(".").pop()?.toLowerCase();
  const mimeType =
    extension === "png"
      ? "image/png"
      : extension === "webp"
        ? "image/webp"
        : "image/jpeg";

  form.append(fieldName, {
    uri: localUri,
    type: mimeType,
    name: filename.includes(".") ? filename : `${filename}.jpg`,
  } as unknown as Blob);
}

export async function uploadImage(localUri: string): Promise<MediaUploadResult> {
  const form = new FormData();
  appendLocalImage(form, "image", localUri);

  const response = await apiClient.post("/media/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return parseApiResponse<MediaUploadResult>(response.data);
}

export async function uploadImages(
  localUris: readonly string[],
): Promise<MediaUploadResult[]> {
  const form = new FormData();
  for (const localUri of localUris.slice(0, MAX_IMAGES_PER_UPLOAD)) {
    appendLocalImage(form, "images", localUri);
  }

  const response = await apiClient.post("/media/upload/multiple", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const result = parseApiResponse<MediaUploadMultipleResult>(response.data);
  return result.images;
}
