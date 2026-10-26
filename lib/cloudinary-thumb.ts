import { PixelRatio } from "react-native";

const UPLOAD_SEGMENT = "/image/upload/";

/**
 * Square, auto-format thumbnail URL for a Cloudinary image. `size` is in
 * points; it's scaled to device pixels. Non-Cloudinary URLs (local files,
 * other hosts) come back unchanged.
 */
export function cloudinaryThumb(url: string, size: number): string {
  const index = url.indexOf(UPLOAD_SEGMENT);
  if (!url.includes("res.cloudinary.com") || index === -1) return url;

  const px = Math.ceil(PixelRatio.getPixelSizeForLayoutSize(size));
  const transform = `c_fill,g_auto,w_${px},h_${px},q_auto,f_auto`;
  const splitAt = index + UPLOAD_SEGMENT.length;
  return `${url.slice(0, splitAt)}${transform}/${url.slice(splitAt)}`;
}
