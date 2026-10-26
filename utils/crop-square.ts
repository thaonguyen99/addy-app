import * as ImageManipulator from "expo-image-manipulator";

/**
 * Crops a photo to its centered square. The capture viewfinder is a square
 * camera preview that fills (covers) the sensor frame, so at any zoom the
 * centered square is exactly what the user saw. Already-square images come
 * back unchanged.
 */
export async function cropCenterSquare(uri: string): Promise<string> {
  const context = ImageManipulator.ImageManipulator.manipulate(uri);
  // Rendering first applies EXIF orientation, so width/height are upright.
  const image = await context.renderAsync();
  const { width, height } = image;
  if (width === height) return uri;

  const side = Math.min(width, height);
  const cropped = await ImageManipulator.ImageManipulator.manipulate(image)
    .crop({
      originX: Math.round((width - side) / 2),
      originY: Math.round((height - side) / 2),
      width: side,
      height: side,
    })
    .renderAsync();
  const saved = await cropped.saveAsync({
    format: ImageManipulator.SaveFormat.JPEG,
    compress: 0.95,
  });
  return saved.uri;
}
