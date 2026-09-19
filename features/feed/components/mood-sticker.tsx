import { StyleSheet, Text, View } from "react-native";

import { StickerShadowBox } from "@/components/ui/sticker-shadow";
import { BrandColors } from "@/constants/theme";
import { MOOD_SCORE_OPTIONS } from "@/features/camera/constants/mood-score";

type MoodStickerProps = {
  score: number | null | undefined;
  size?: number;
  /** Tilted "hanging off the corner" style for a hero moment; false gives a
   *  small, level, inset badge for tight grid/list contexts. */
  tilted?: boolean;
  backgroundColor?: string;
};

/**
 * A small "stuck on afterward" sticker showing a memory's mood — meant to be
 * absolutely positioned by the caller over the top-right corner of a photo.
 * Shared by the feed card and the memory detail hero so mood reads as the
 * same object in both places.
 */
export function MoodSticker({
  score,
  size = 32,
  tilted = true,
  backgroundColor = BrandColors.accentPink,
}: MoodStickerProps) {
  const mood =
    score != null ? MOOD_SCORE_OPTIONS.find((o) => o.score === score) : null;

  if (!mood) return null;

  return (
    <StickerShadowBox
      radius={size / 2}
      shadowOffset={2}
      style={tilted ? { transform: [{ rotate: "12deg" }] } : undefined}
    >
      <View
        style={[
          styles.sticker,
          { width: size, height: size, borderRadius: size / 2, backgroundColor },
        ]}
      >
        <Text style={[styles.emoji, { fontSize: size * 0.5 }]}>{mood.emoji}</Text>
      </View>
    </StickerShadowBox>
  );
}

const styles = StyleSheet.create({
  sticker: {
    borderWidth: 2.5,
    borderColor: BrandColors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { textAlign: "center" },
});
