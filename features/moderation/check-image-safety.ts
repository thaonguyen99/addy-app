import { imageToModelInput } from "@/features/moderation/image-tensor";
import { getNsfwModel } from "@/features/moderation/nsfw-model";

/**
 * open_nsfw outputs a 2-way softmax, [sfw, nsfw]. Yahoo's guidance reads
 * scores above 0.8 as NSFW and below 0.2 as safe. A flag only triggers a
 * warning the user can override (see confirm-flagged-photos.ts), so we use
 * the upper bound rather than catching the uncertain middle.
 */
const NSFW_INDEX = 1;
const NSFW_THRESHOLD = 0.8;

export type ImageSafetyResult = {
  uri: string;
  safe: boolean;
  /** The model's NSFW probability; `null` when it couldn't run (fail-open). */
  nsfwScore: number | null;
};

/**
 * Best-effort, on-device pre-check for obviously unsafe photos before they
 * ever leave the device. This is NOT a substitute for server-side
 * moderation — it exists purely to catch the obvious cases for free and
 * give the user instant feedback. It fails open (treats the image as safe)
 * whenever the model is missing or classification errors, so a broken model
 * asset never blocks uploads outright.
 */
export async function checkImageSafety(uri: string): Promise<ImageSafetyResult> {
  const model = await getNsfwModel();
  if (!model) {
    return { uri, safe: true, nsfwScore: null };
  }

  try {
    const input = await imageToModelInput(uri);
    const outputs = model.runSync([input.buffer as ArrayBuffer]);
    const nsfwScore = new Float32Array(outputs[0])[NSFW_INDEX] ?? 0;

    return { uri, safe: nsfwScore <= NSFW_THRESHOLD, nsfwScore };
  } catch (error) {
    console.warn(
      `[moderation] Failed to classify image, allowing it through: ${uri}`,
      error,
    );
    return { uri, safe: true, nsfwScore: null };
  }
}

/** Runs {@link checkImageSafety} over multiple images, one at a time. */
export async function checkImagesSafety(
  uris: readonly string[],
): Promise<ImageSafetyResult[]> {
  const results: ImageSafetyResult[] = [];
  for (const uri of uris) {
    results.push(await checkImageSafety(uri));
  }
  return results;
}
