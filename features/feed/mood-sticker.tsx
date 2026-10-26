import { StyleSheet, Text } from "react-native";

import { AddyColors } from "@/constants/theme";
import { MOOD_SCORE_OPTIONS } from "@/features/camera/constants/mood-score";
import { stableTiltDeg } from "@/lib/stable-hash";

type MoodStickerProps = {
  score: number | null | undefined;
  size?: number;
  /** False keeps the emoji level, for tight grid/list contexts. */
  tilted?: boolean;
  /** Stable seed for the tilt (e.g. the memory id) so it never jitters. */
  seed?: string;
};

/**
 * A memory's mood as a bare emoji sticker: no circle, a slight tilt and a
 * soft drop shadow. The caller positions it over a photo or bubble.
 */
export function MoodSticker({
  score,
  size = 32,
  tilted = true,
  seed,
}: MoodStickerProps) {
  const mood =
    score != null ? MOOD_SCORE_OPTIONS.find((o) => o.score === score) : null;

  if (!mood) return null;

  const tilt = tilted ? stableTiltDeg(seed ?? String(score)) : 0;

  return (
    <Text
      style={[
        styles.emoji,
        {
          fontSize: size,
          lineHeight: size * 1.2,
          transform: [{ rotate: `${tilt}deg` }],
        },
      ]}
      accessibilityLabel={`Mood: ${mood.label}`}
    >
      {mood.emoji}
    </Text>
  );
}

const styles = StyleSheet.create({
  emoji: {
    textAlign: "center",
    textShadowColor: "rgba(40, 44, 92, 0.28)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    color: AddyColors.ink,
  },
});
