import { imageToModelInput } from "@/features/moderation/image-tensor";
import { getNsfwModel } from "@/features/moderation/nsfw-model";

// Matches the reference nsfw_model's fixed output order.
const CATEGORIES = ["drawings", "hentai", "neutral", "porn", "sexy"] as const;
type Category = (typeof CATEGORIES)[number];
type NsfwScores = Record<Category, number>;

// Thresholds follow common nsfwjs usage: flag anything the model is
// confident is porn/hentai, or fairly confident is merely "sexy"
// (suggestive but not explicit). Tune these if you see too many
// false positives/negatives once this is bundled with a real model.
const PORN_HENTAI_THRESHOLD = 0.6;
const SEXY_THRESHOLD = 0.85;

export type ImageSafetyResult = {
  uri: string;
  safe: boolean;
  /** `null` when the model couldn't run — treated as safe (fail-open). */
  scores: NsfwScores | null;
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
    return { uri, safe: true, scores: null };
  }

  try {
    const input = await imageToModelInput(uri);
    const outputs = model.runSync([input.buffer as ArrayBuffer]);
    const probabilities = new Float32Array(outputs[0]);

    const scores = CATEGORIES.reduce((acc, category, index) => {
      acc[category] = probabilities[index] ?? 0;
      return acc;
    }, {} as NsfwScores);

    const unsafe =
      scores.porn + scores.hentai > PORN_HENTAI_THRESHOLD ||
      scores.sexy > SEXY_THRESHOLD;

    return { uri, safe: !unsafe, scores };
  } catch (error) {
    console.warn(
      `[moderation] Failed to classify image, allowing it through: ${uri}`,
      error,
    );
    return { uri, safe: true, scores: null };
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
