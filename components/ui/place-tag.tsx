import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { AddyColors, AddyFonts, AddyRadius } from "@/constants/theme";

type PlaceTagProps = {
  name: string;
  style?: StyleProp<ViewStyle>;
  /** Makes the pill a button, e.g. to show the place on the map. */
  onPress?: () => void;
  accessibilityLabel?: string;
};

/**
 * Cyan "📍 Place name" pill. Uses Be Vietnam Pro, not VT323: place names are
 * often long and Vietnamese, and VT323 has no diacritics.
 */
export function PlaceTag({
  name,
  style,
  onPress,
  accessibilityLabel,
}: PlaceTagProps) {
  const label = (
    <Text style={styles.text} numberOfLines={1}>
      📍 {name}
    </Text>
  );
  if (!onPress) return <View style={[styles.tag, style]}>{label}</View>;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.tag, pressed && styles.pressed, style]}
    >
      {label}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    backgroundColor: AddyColors.cyan,
    borderRadius: AddyRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pressed: { opacity: 0.7 },
  text: {
    fontFamily: AddyFonts.bodySemiBold,
    fontSize: 12,
    color: AddyColors.ink,
  },
});
