import * as ImageManipulator from "expo-image-manipulator";
import { decode as decodeJpeg } from "jpeg-js";

/** Must match the input size the bundled model was trained/converted for. */
export const MODEL_INPUT_SIZE = 224;

/**
 * Resizes the image to the model's expected 224x224 input and returns its
 * pixel data as an RGB Float32Array normalized to [0, 1] (alpha dropped),
 * matching the reference nsfw_model preprocessing (Keras `image /= 255`).
 */
export async function imageToModelInput(uri: string): Promise<Float32Array> {
  const rendered = await ImageManipulator.ImageManipulator.manipulate(uri)
    .resize({ width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE })
    .renderAsync();

  const { base64 } = await rendered.saveAsync({
    base64: true,
    format: ImageManipulator.SaveFormat.JPEG,
    compress: 1,
  });

  if (!base64) {
    throw new Error("Image manipulation did not return base64 data");
  }

  const decoded = decodeJpeg(base64ToUint8Array(base64), { useTArray: true });

  const pixelCount = MODEL_INPUT_SIZE * MODEL_INPUT_SIZE;
  const rgb = new Float32Array(pixelCount * 3);
  for (let i = 0; i < pixelCount; i++) {
    const srcOffset = i * 4; // decoded.data is RGBA
    const dstOffset = i * 3;
    rgb[dstOffset] = decoded.data[srcOffset] / 255;
    rgb[dstOffset + 1] = decoded.data[srcOffset + 1] / 255;
    rgb[dstOffset + 2] = decoded.data[srcOffset + 2] / 255;
  }
  return rgb;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
