import * as ImageManipulator from "expo-image-manipulator";
import { decode as decodeJpeg } from "jpeg-js";

/** The square the image is resized to before cropping (open_nsfw's Caffe pipeline). */
export const RESIZE_SIZE = 256;
/** Must match the input size the bundled model was converted for. */
export const MODEL_INPUT_SIZE = 224;
/** Training-set per-channel means, in BGR order, on the 0-255 scale. */
const BGR_MEAN = [104, 117, 123] as const;
/**
 * The reference pipeline round-trips the 256x256 image through JPEG at PIL's
 * default quality (75) to reproduce the compression artifacts the model was
 * trained on.
 */
const JPEG_QUALITY = 0.75;

/**
 * Builds the open_nsfw model input from an image: resize to 256x256, JPEG
 * round trip, center-crop 224x224, then BGR float32 with the channel means
 * subtracted. Mirrors opennsfw2's `Preprocessing.YAHOO` — see
 * scripts/convert-nsfw-model.py.
 */
export async function imageToModelInput(uri: string): Promise<Float32Array> {
  const rendered = await ImageManipulator.ImageManipulator.manipulate(uri)
    .resize({ width: RESIZE_SIZE, height: RESIZE_SIZE })
    .renderAsync();

  const { base64 } = await rendered.saveAsync({
    base64: true,
    format: ImageManipulator.SaveFormat.JPEG,
    compress: JPEG_QUALITY,
  });

  if (!base64) {
    throw new Error("Image manipulation did not return base64 data");
  }

  const decoded = decodeJpeg(base64ToUint8Array(base64), { useTArray: true });
  return rgbaToModelInput(decoded.data, decoded.width, decoded.height);
}

/**
 * Center-crops RGBA pixels to 224x224 and converts them to mean-subtracted
 * BGR float32. Pure, so it can be checked against the Python reference.
 */
export function rgbaToModelInput(
  rgba: Uint8Array,
  width: number,
  height: number,
): Float32Array {
  if (width < MODEL_INPUT_SIZE || height < MODEL_INPUT_SIZE) {
    throw new Error(`Image is ${width}x${height}, smaller than the model input`);
  }

  const top = Math.floor((height - MODEL_INPUT_SIZE) / 2);
  const left = Math.floor((width - MODEL_INPUT_SIZE) / 2);
  const out = new Float32Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3);

  for (let y = 0; y < MODEL_INPUT_SIZE; y++) {
    for (let x = 0; x < MODEL_INPUT_SIZE; x++) {
      const src = ((top + y) * width + (left + x)) * 4;
      const dst = (y * MODEL_INPUT_SIZE + x) * 3;
      out[dst] = rgba[src + 2] - BGR_MEAN[0];
      out[dst + 1] = rgba[src + 1] - BGR_MEAN[1];
      out[dst + 2] = rgba[src] - BGR_MEAN[2];
    }
  }
  return out;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
