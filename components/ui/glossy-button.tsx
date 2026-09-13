import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { StickerCard } from "@/components/ui/sticker-card";
import { BrandColors } from "@/constants/theme";
import { StickerRadius } from "@/constants/sticker-style";

type GlossyButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Primary/secondary CTA button in the sticker rebrand's visual language. */
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
      style={[disabled ? styles.disabled : null, style]}
    >
      <StickerCard
        radius={StickerRadius.button}
        borderStyle={isPrimary ? "solid" : "dashed"}
        backgroundColor={isPrimary ? undefined : BrandColors.paper}
        gradientColors={isPrimary ? [BrandColors.primaryLight, BrandColors.primary] : undefined}
        shadow={isPrimary}
      >
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator color={BrandColors.ink} />
          ) : (
            <Text style={styles.label}>{label}</Text>
          )}
        </View>
      </StickerCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: "Fredoka-SemiBold",
    fontSize: 16,
    color: BrandColors.ink,
  },
  disabled: {
    opacity: 0.5,
  },
});
