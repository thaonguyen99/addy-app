import * as ImageManipulator from "expo-image-manipulator";

const MAX_LONG_EDGE = 2048;
const JPEG_QUALITY = 0.85;

export type PreparedUploadImage = {
  uri: string;
  width: number;
  height: number;
};

/**
 * Re-encodes a local photo before it can leave the device: decodes it to a
 * bitmap and writes a fresh JPEG, which drops all source metadata (EXIF, GPS).
 * Downscales so the long edge is at most 2048px; never upscales.
 */
export async function prepareUploadImage(
  uri: string,
): Promise<PreparedUploadImage> {
  let image = await ImageManipulator.ImageManipulator.manipulate(uri).renderAsync();

  const longEdge = Math.max(image.width, image.height);
  if (longEdge > MAX_LONG_EDGE) {
    const resize =
      image.width >= image.height
        ? { width: MAX_LONG_EDGE }
        : { height: MAX_LONG_EDGE };
    image = await ImageManipulator.ImageManipulator.manipulate(image)
      .resize(resize)
      .renderAsync();
  }

  const saved = await image.saveAsync({
    format: ImageManipulator.SaveFormat.JPEG,
    compress: JPEG_QUALITY,
  });

  return { uri: saved.uri, width: saved.width, height: saved.height };
}
