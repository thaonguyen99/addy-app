import * as ImageManipulator from "expo-image-manipulator";

export type ImageSize = { width: number; height: number };

export type CropRotation = 0 | 90 | 180 | 270;

/**
 * How a photo sits in the square crop frame. The photo is first turned
 * clockwise by `rotation`, then mirrored left-right as seen (`flipped`); `scale` 1
 * is "cover" (the short edge fills the square) and `x`/`y` move its center
 * away from the frame's center, in fractions of the frame's side.
 */
export type CropTransform = {
  scale: number;
  x: number;
  y: number;
  rotation: CropRotation;
  flipped: boolean;
};

export const IDENTITY_CROP: CropTransform = {
  scale: 1,
  x: 0,
  y: 0,
  rotation: 0,
  flipped: false,
};
export const MAX_CROP_ZOOM = 5;

/** The photo's size once turned by `rotation`. */
export function orientedSize(size: ImageSize, rotation: CropRotation): ImageSize {
  "worklet";
  return rotation % 180 === 0
    ? size
    : { width: size.height, height: size.width };
}

/** A quarter turn clockwise as seen; the framing restarts from "cover". */
export function rotateCrop(transform: CropTransform): CropTransform {
  // Mirrored, the photo's own clockwise reads as counter-clockwise.
  const step = transform.flipped ? 270 : 90;
  return {
    ...IDENTITY_CROP,
    flipped: transform.flipped,
    rotation: ((transform.rotation + step) % 360) as CropRotation,
  };
}

/** Back to filling the square, centered; keeps rotation and flip. */
export function fillCrop(transform: CropTransform): CropTransform {
  return { ...transform, scale: 1, x: 0, y: 0 };
}

/** Mirrors left-right, keeping the same part of the photo in the frame. */
export function flipCrop(transform: CropTransform): CropTransform {
  return { ...transform, flipped: !transform.flipped, x: -transform.x };
}

/** The furthest `x`/`y` can go at `scale` while the square stays covered. */
export function maxCropOffset(size: ImageSize, scale: number) {
  "worklet";
  const short = Math.min(size.width, size.height);
  return {
    x: Math.max(0, ((size.width / short) * scale - 1) / 2),
    y: Math.max(0, ((size.height / short) * scale - 1) / 2),
  };
}

/**
 * Flips, rotates and crops to the square the frame showed, and saves it as a
 * JPEG. `size` is the (unrotated) aspect the transform was made against; the
 * crop is applied in fractions, so a preview decoded at a lower resolution
 * still lines up with the original.
 */
export async function cropToSquare(
  uri: string,
  size: ImageSize,
  transform: CropTransform,
): Promise<string> {
  const { width: w, height: h } = orientedSize(size, transform.rotation);
  const short = Math.min(w, h);
  const side = short / transform.scale;
  const centerX = w / 2 - (transform.x * short) / transform.scale;
  const centerY = h / 2 - (transform.y * short) / transform.scale;

  // Rendering applies EXIF orientation first, so these act on the upright
  // photo — in the same order as the frame's preview (rotate, then flip).
  let context = ImageManipulator.ImageManipulator.manipulate(uri);
  if (transform.rotation) context = context.rotate(transform.rotation);
  if (transform.flipped) {
    context = context.flip(ImageManipulator.FlipType.Horizontal);
  }
  const image = await context.renderAsync();
  const sidePx = Math.floor(
    Math.min((side / w) * image.width, (side / h) * image.height),
  );
  const clampOrigin = (value: number, max: number) =>
    Math.min(Math.max(0, Math.round(value)), max - sidePx);

  const cropped = await ImageManipulator.ImageManipulator.manipulate(image)
    .crop({
      originX: clampOrigin(((centerX - side / 2) / w) * image.width, image.width),
      originY: clampOrigin(((centerY - side / 2) / h) * image.height, image.height),
      width: sidePx,
      height: sidePx,
    })
    .renderAsync();
  const saved = await cropped.saveAsync({
    format: ImageManipulator.SaveFormat.JPEG,
    compress: 0.95,
  });
  return saved.uri;
}
