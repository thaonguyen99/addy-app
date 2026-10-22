import { ReactNode } from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";

export type TechChipTone = "paper" | "dark" | "lime" | "pink" | "cyan" | "ghost";

const TONES: Record<
  TechChipTone,
  { bg: string; fg: string; border: string }
> = {
  paper: { bg: AddyColors.white, fg: AddyColors.ink, border: AddyColors.line },
  dark: { bg: AddyColors.ink, fg: AddyColors.white, border: AddyColors.ink },
  lime: { bg: AddyColors.lime, fg: AddyColors.ink, border: AddyColors.limeDeep },
  pink: { bg: AddyColors.pink, fg: AddyColors.white, border: AddyColors.pink },
  cyan: { bg: AddyColors.cyan, fg: AddyColors.ink, border: AddyColors.cyan },
  ghost: {
    bg: "rgba(255, 255, 255, 0.14)",
    fg: AddyColors.white,
    border: "rgba(255, 255, 255, 0.28)",
  },
};

type TechChipProps = {
  label: string;
  tone?: TechChipTone;
  /** Leading emoji or icon. */
  leading?: ReactNode;
  /** Trailing glyph, e.g. "›". */
  trailing?: string;
  onPress?: () => void;
  accessibilityLabel?: string;
  size?: "sm" | "md";
  style?: StyleProp<ViewStyle>;
};

/**
 * Short tech label in VT323: counts, timestamps, "quick snap", zoom levels.
 * Never put more than a few words in one.
 */
export function TechChip({
  label,
  tone = "paper",
  leading,
  trailing,
  onPress,
  accessibilityLabel,
  size = "md",
  style,
}: TechChipProps) {
  const colors = TONES[tone];
  const content = (
    <View
      style={[
        styles.chip,
        size === "sm" && styles.chipSm,
        { backgroundColor: colors.bg, borderColor: colors.border },
        tone !== "ghost" && AddyShadow.soft,
        style,
      ]}
    >
      {typeof leading === "string" ? (
        <Text style={styles.leadingEmoji}>{leading}</Text>
      ) : (
        leading
      )}
      <Text
        style={[styles.label, size === "sm" && styles.labelSm, { color: colors.fg }]}
        numberOfLines={1}
      >
        {label}
        {trailing ? ` ${trailing}` : ""}
      </Text>
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => (pressed ? styles.pressed : undefined)}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    borderRadius: AddyRadius.chip,
    borderWidth: ADDY_BORDER_WIDTH,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  chipSm: { paddingHorizontal: 7, paddingVertical: 1 },
  label: {
    fontFamily: AddyFonts.tech,
    fontSize: 18,
    lineHeight: 20,
  },
  labelSm: { fontSize: 15, lineHeight: 17 },
  leadingEmoji: { fontSize: 12 },
  pressed: { opacity: 0.75 },
});
