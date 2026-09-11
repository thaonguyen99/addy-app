import { StyleSheet, Text, View } from "react-native";

import { BrandColors } from "@/constants/theme";
import { MOOD_SCORE_OPTIONS } from "@/features/camera/constants/mood-score";

type MoodStickerProps = {
  score: number | null | undefined;
};

/**
 * A small "stuck on afterward" sticker showing a memory's mood — meant to be
 * absolutely positioned by the caller over the top-right corner of a polaroid
 * photo. Shared by the feed card and the memory detail hero so mood reads as
 * the same object in both places.
 */
export function MoodSticker({ score }: MoodStickerProps) {
  const mood =
    score != null ? MOOD_SCORE_OPTIONS.find((o) => o.score === score) : null;

  if (!mood) return null;

  return (
    <View style={styles.sticker}>
      <Text style={styles.emoji}>{mood.emoji}</Text>
    </View>
  );
}

const SIZE = 32;

const styles = StyleSheet.create({
  sticker: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: BrandColors.paper,
    borderWidth: 1.5,
    borderColor: BrandColors.white,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "8deg" }],
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  emoji: { fontSize: 16 },
});
