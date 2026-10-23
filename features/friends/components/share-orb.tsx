import { Pressable, StyleSheet, Text, View } from "react-native";

import { ADDY_BORDER_WIDTH, AddyColors, AddyFonts, AddyShadow } from "@/constants/theme";

/** A pastel bubble with an emoji glyph; the label sits under it when given. */
export function ShareOrb({
  glyph,
  color,
  label,
  accessibilityLabel,
  size = 56,
  disabled = false,
  onPress,
}: {
  glyph: string;
  color: string;
  label?: string;
  accessibilityLabel: string;
  size?: number;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.orb,
          AddyShadow.soft,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        ]}
      >
        <View style={[styles.shine, { width: size * 0.45, height: size * 0.25 }]} />
        <Text style={{ fontSize: size * 0.4 }}>{glyph}</Text>
      </View>
      {label ? (
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export const ORB_COLORS = {
  zalo: "#D7EEFF",
  messenger: "#E7DDFF",
  sms: "#DDF7E4",
  story: "#FFDDEE",
  more: "#EEF4FA",
};

const styles = StyleSheet.create({
  cell: { alignItems: "center", gap: 6 },
  orb: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
  },
  shine: {
    position: "absolute",
    top: 5,
    left: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },
  label: { fontFamily: AddyFonts.body, fontSize: 13, color: AddyColors.ink },
  pressed: { opacity: 0.75 },
});
