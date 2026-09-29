import { loadTensorflowModel, type TensorflowModel } from "react-native-fast-tflite";

let modelPromise: Promise<TensorflowModel | null> | null = null;

/**
 * Lazily loads the bundled on-device NSFW classifier and caches it for the
 * lifetime of the app. Resolves to `null` instead of throwing when the model
 * asset is missing/invalid or fails to load on this device, so this stays a
 * best-effort pre-check rather than something that can brick uploads if the
 * model is ever absent — see assets/models/README.md.
 */
export function getNsfwModel(): Promise<TensorflowModel | null> {
  if (!modelPromise) {
    modelPromise = loadTensorflowModel(
      // react-native-fast-tflite requires a literal require() so Metro can
      // resolve it as a bundled asset — an import won't work here.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@/assets/models/nsfw-model.tflite"),
      [],
    ).catch((error: unknown) => {
      console.warn(
        "[moderation] Could not load the on-device NSFW model — photo pre-check is disabled until it's fixed.",
        error,
      );
      return null;
    });
  }
  return modelPromise;
}
