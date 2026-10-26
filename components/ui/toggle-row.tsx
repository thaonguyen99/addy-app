import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { AddyColors, AddyFonts } from "@/constants/theme";

type ToggleRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  /** Extra control between the text and the switch (e.g. a time chip). */
  accessory?: ReactNode;
};

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 32;
const KNOB = 26;
const TRACK_OFF = "#D9DCE3";

/**
 * A `Pressable`-based two-state switch row. The app has no `Switch`
 * primitive and RN core `Switch` doesn't take the Addy look, so this is the
 * shared control for settings toggles.
 */
export function ToggleRow({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  accessory,
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
    outputRange: [TRACK_OFF, AddyColors.limeDeep],
  });

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      style={[styles.row, disabled && styles.disabled]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={label}
      accessibilityHint={description}
    >
      <View style={styles.textCol}>
        <Text style={styles.label}>{label}</Text>
        {description ? (
          <Text style={styles.description}>{description}</Text>
        ) : null}
      </View>
      {accessory}
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
    gap: 12,
    paddingVertical: 12,
  },
  disabled: { opacity: 0.5 },
  textCol: { flex: 1, gap: 0 },
  label: {
    fontFamily: AddyFonts.title,
    fontSize: 17,
    lineHeight: 24,
    color: AddyColors.ink,
  },
  description: {
    fontFamily: AddyFonts.tech,
    fontSize: 16,
    lineHeight: 19,
    color: AddyColors.inkMuted,
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
    backgroundColor: AddyColors.white,
    boxShadow: "0 1px 3px rgba(40, 44, 92, 0.25)",
  },
});
