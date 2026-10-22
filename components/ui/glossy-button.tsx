import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
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
  AddyGradients,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";

type GlossyButtonProps = {
  label: string;
  onPress: () => void;
  /** primary = lime gloss pill; secondary = white pill with a dashed border. */
  variant?: "primary" | "secondary";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Pill CTA ("Pin it", "Save changes"). */
export function GlossyButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}: GlossyButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      style={({ pressed }) => [
        styles.pill,
        isPrimary ? styles.primary : styles.secondary,
        isPrimary && AddyShadow.soft,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {isPrimary ? (
        <>
          <LinearGradient
            colors={AddyGradients.limeGloss}
            style={StyleSheet.absoluteFill}
          />
          {/* White inner highlight across the top half. */}
          <View style={styles.highlight} />
        </>
      ) : null}
      {loading ? (
        <ActivityIndicator color={AddyColors.ink} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 50,
    paddingHorizontal: 22,
    borderRadius: AddyRadius.pill,
    borderWidth: ADDY_BORDER_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  primary: { borderColor: AddyColors.limeDeep },
  secondary: {
    backgroundColor: AddyColors.white,
    borderColor: AddyColors.line,
    borderStyle: "dashed",
  },
  highlight: {
    position: "absolute",
    top: 2,
    left: 14,
    right: 14,
    height: "42%",
    borderRadius: AddyRadius.pill,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
  },
  label: {
    fontFamily: AddyFonts.title,
    fontSize: 17,
    color: AddyColors.ink,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});
