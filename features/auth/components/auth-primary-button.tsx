import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from "react-native";

import { BrandColors } from "@/constants/theme";

type AuthPrimaryButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  loading?: boolean;
  variant?: "primary" | "secondary";
};

export function AuthPrimaryButton({
  label,
  loading,
  variant = "primary",
  disabled,
  ...props
}: AuthPrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === "secondary" ? styles.secondary : styles.primary,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={BrandColors.neutral} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "secondary" ? styles.secondaryLabel : null,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  primary: { backgroundColor: BrandColors.primary },
  secondary: {
    backgroundColor: BrandColors.secondary,
    borderWidth: 1,
    borderColor: BrandColors.neutralBorder,
  },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.88 },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: BrandColors.neutral,
  },
  secondaryLabel: { color: BrandColors.neutral },
});
