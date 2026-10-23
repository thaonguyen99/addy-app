import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  type ViewStyle,
} from "react-native";

import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyGradients,
  AddyRadius,
} from "@/constants/theme";

export type PillTone = "lime" | "cyan" | "paper" | "text";

type PillButtonProps = {
  label: string;
  onPress: () => void;
  tone?: PillTone;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Compact row action: Add, Accept, Sent, Cancel. 44px tall touch target. */
export function PillButton({
  label,
  onPress,
  tone = "lime",
  loading = false,
  disabled = false,
  accessibilityLabel,
  style,
}: PillButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.pill,
        tone === "cyan" && styles.cyan,
        tone === "paper" && styles.paper,
        tone === "text" && styles.text,
        pressed && styles.pressed,
        style,
      ]}
    >
      {tone === "lime" ? (
        <LinearGradient
          colors={AddyGradients.limeGloss}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator size="small" color={AddyColors.ink} />
      ) : (
        <Text
          style={[styles.label, tone === "text" && styles.textLabel]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 40,
    minWidth: 72,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: AddyRadius.pill,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.limeDeep,
  },
  cyan: { backgroundColor: AddyColors.cyan, borderColor: "#3AA8E0" },
  paper: { backgroundColor: AddyColors.white, borderColor: AddyColors.line },
  text: { borderColor: "transparent", minWidth: 0, paddingHorizontal: 8 },
  label: { fontFamily: AddyFonts.title, fontSize: 15, color: AddyColors.ink },
  textLabel: {
    fontFamily: AddyFonts.tech,
    fontSize: 19,
    color: AddyColors.inkMuted,
  },
  pressed: { opacity: 0.75 },
});
