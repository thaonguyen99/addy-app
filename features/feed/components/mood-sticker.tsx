import { StyleSheet, Text } from "react-native";

import { StickerShadowBox } from "@/components/ui/sticker-shadow";
import { BrandColors } from "@/constants/theme";
import { MOOD_SCORE_OPTIONS } from "@/features/camera/constants/mood-score";

type MoodStickerProps = {
  score: number | null | undefined;
  size?: number;
};

/**
 * A small "stuck on afterward" sticker showing a memory's mood — meant to be
 * absolutely positioned by the caller over the top-right corner of a photo.
 * Shared by the feed card and the memory detail hero so mood reads as the
 * same object in both places.
 */
export function MoodSticker({ score, size = 32 }: MoodStickerProps) {
  const mood =
    score != null ? MOOD_SCORE_OPTIONS.find((o) => o.score === score) : null;

  if (!mood) return null;

  return (
    <StickerShadowBox
      radius={size / 2}
      shadowOffset={2}
      style={[styles.sticker, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <Text style={[styles.emoji, { fontSize: size * 0.5 }]}>{mood.emoji}</Text>
    </StickerShadowBox>
  );
}

const styles = StyleSheet.create({
  sticker: {
    backgroundColor: BrandColors.accentPink,
    borderWidth: 2.5,
    borderColor: BrandColors.ink,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "12deg" }],
  },
  emoji: { textAlign: "center" },
});
