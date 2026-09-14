import { Pressable, StyleSheet, Text, View } from "react-native";

import { StickerCard } from "@/components/ui/sticker-card";
import { StickerRadius } from "@/constants/sticker-style";
import { BrandColors } from "@/constants/theme";
import { MOOD_SCORE_OPTIONS } from "@/features/camera/constants/mood-score";
import { cameraLayout } from "@/features/camera/styles/shared-styles";

type MoodScorePickerProps = Readonly<{
  value: number | null;
  onChange: (score: number | null) => void;
}>;

export function MoodScorePicker({ value, onChange }: MoodScorePickerProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>How are you feeling?</Text>
      <Text style={styles.hint}>Optional — tap to set your mood</Text>
      <View style={styles.row}>
        {MOOD_SCORE_OPTIONS.map((option) => {
          const selected = value === option.score;
          return (
            <Pressable
              key={option.score}
              accessibilityRole="button"
              accessibilityLabel={`Mood ${option.label}`}
              accessibilityState={{ selected }}
              onPress={() => onChange(selected ? null : option.score)}
              style={({ pressed }) => [
                styles.optionWrap,
                pressed && styles.optionPressed,
              ]}
            >
              <StickerCard
                style={styles.optionCard}
                radius={StickerRadius.chip}
                backgroundColor={selected ? undefined : BrandColors.paper}
                gradientColors={
                  selected
                    ? [BrandColors.primaryLight, BrandColors.primary]
                    : undefined
                }
                shadow={selected}
                shadowOffset={2}
              >
                <View style={styles.emojiWrap}>
                  <Text style={styles.emoji}>{option.emoji}</Text>
                </View>
              </StickerCard>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
    paddingHorizontal: cameraLayout.screenPaddingHorizontal,
    paddingTop: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: BrandColors.ink,
  },
  hint: {
    fontSize: 13,
    color: BrandColors.inkMuted,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  optionWrap: {
    flex: 1,
    minWidth: 40,
    aspectRatio: 1,
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionCard: {
    flex: 1,
  },
  emojiWrap: {
    width: "100%",
    textAlign: "center",
    textAlignVertical: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  emoji: {
    fontSize: 26,
  },
});
