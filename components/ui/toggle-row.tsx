import { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BrandColors } from "@/constants/theme";

type ToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
};

const TRACK_WIDTH = 46;
const TRACK_HEIGHT = 28;
const KNOB = 22;

/**
 * A `Pressable`-based two-state switch. The app has no `Switch` primitive and
 * RN core `Switch` fights the dark theme, so this is the shared control for
 * settings toggles (memory visibility, notification preferences).
 */
export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
}: ToggleRowProps) {
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [value, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [3, TRACK_WIDTH - KNOB - 3],
  });
  const trackColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [BrandColors.gray500, BrandColors.primary],
  });

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      style={[styles.row, disabled && styles.disabled]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
    >
      <View style={styles.textCol}>
        <Text style={styles.label}>{label}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[styles.knob, { transform: [{ translateX }] }]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 10,
  },
  disabled: { opacity: 0.5 },
  textCol: { flex: 1, gap: 2 },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: BrandColors.neutral,
  },
  description: {
    fontSize: 13,
    color: BrandColors.neutralMuted,
    lineHeight: 18,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: "center",
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: BrandColors.white,
  },
});
