import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { GlossyOrb } from "@/components/ui/glossy-orb";
import { MOOD_SCORE_OPTIONS } from "@/features/camera/constants/mood-score";

const SLOT = 48;
const ORB = 42;

type MoodRowProps = {
  value: number | null;
  /** Tapping the selected mood again clears it — mood is optional. */
  onChange: (score: number | null) => void;
};

/** Five mood emoji; the selected one sits on a glossy lime orb. */
export const MoodRow = memo(function MoodRow({ value, onChange }: MoodRowProps) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {MOOD_SCORE_OPTIONS.map((option) => {
        const selected = option.score === value;
        return (
          <Pressable
            key={option.score}
            onPress={() => onChange(selected ? null : option.score)}
            accessibilityRole="radio"
            accessibilityLabel={`Mood: ${option.label}`}
            accessibilityState={{ selected }}
            style={styles.slot}
          >
            {selected ? (
              <GlossyOrb size={ORB} style={styles.selected}>
                <Text style={styles.emoji}>{option.emoji}</Text>
              </GlossyOrb>
            ) : (
              <Text style={styles.emoji}>{option.emoji}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "space-between" },
  slot: {
    width: SLOT,
    height: SLOT,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: { transform: [{ scale: 1.12 }] },
  emoji: { fontSize: 24, lineHeight: 30 },
});
