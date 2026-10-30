import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentProps, ReactNode } from "react";
import { Pressable, StyleProp, StyleSheet, ViewStyle } from "react-native";

import { AddyColors } from "@/constants/theme";

const MIN_TOUCH = 44;

type IconCircleButtonProps = {
  /** Ionicons name; pass `children` instead for an emoji or custom glyph. */
  icon?: ComponentProps<typeof Ionicons>["name"];
  children?: ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  /** Visual diameter. The touch target is always at least 44px. */
  size?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Small chrome circle for back / close / settings actions. */
export function IconCircleButton({
  icon,
  children,
  onPress,
  accessibilityLabel,
  size = 30,
  disabled = false,
  style,
}: IconCircleButtonProps) {
  const slop = Math.max(0, (MIN_TOUCH - size) / 2);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={slop}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {children ??
        (icon ? (
          <Ionicons name={icon} size={size * 0.55} color={AddyColors.ink} />
        ) : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
});
