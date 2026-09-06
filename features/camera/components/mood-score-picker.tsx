import { Pressable, StyleSheet, Text, View } from "react-native";

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
              onPress={() =>
                onChange(selected ? null : option.score)
              }
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && styles.optionPressed,
              ]}
            >
              <Text style={styles.emoji}>{option.emoji}</Text>
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
    color: BrandColors.neutral,
  },
  hint: {
    fontSize: 13,
    color: BrandColors.neutralMuted,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  option: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: cameraLayout.cornerRadiusMd,
    borderWidth: 1.5,
    borderColor: BrandColors.neutralBorder,
    backgroundColor: BrandColors.secondary,
  },
  optionSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryMuted,
  },
  optionPressed: {
    opacity: 0.85,
  },
  emoji: {
    fontSize: 26,
  },
});
