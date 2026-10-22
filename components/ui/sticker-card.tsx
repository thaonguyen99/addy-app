import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import { StickerRadius } from "@/constants/sticker-style";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyShadow,
  BrandColors,
} from "@/constants/theme";

type StickerCardProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: "solid" | "dashed";
  backgroundColor?: string;
  /** Renders a vertical two-stop gradient fill instead of `backgroundColor`. */
  gradientColors?: [string, string];
  shadow?: boolean;
  /** Ignored — kept so older call sites compile. Shadows are soft now. */
  shadowOffset?: number;
};

/**
 * Base card surface: rounded rect, 1.5px hairline border, soft shadow, paper
 * (or gradient) fill. The old thick ink outline + hard offset shadow is gone.
 */
export function StickerCard({
  children,
  style,
  radius = StickerRadius.card,
  borderWidth = ADDY_BORDER_WIDTH,
  borderColor,
  borderStyle = "solid",
  backgroundColor = BrandColors.paper,
  gradientColors,
  shadow = true,
}: StickerCardProps) {
  // Older call sites pass the ink color explicitly; map it to the hairline.
  const resolvedBorder =
    !borderColor || borderColor === BrandColors.ink
      ? AddyColors.line
      : borderColor;

  return (
    <View style={[{ borderRadius: radius }, shadow && AddyShadow.soft, style]}>
      <View
        style={{
          borderWidth: Math.min(borderWidth, ADDY_BORDER_WIDTH),
          borderColor: resolvedBorder,
          borderStyle,
          borderRadius: radius,
          overflow: "hidden",
          backgroundColor: gradientColors ? undefined : backgroundColor,
        }}
      >
        {gradientColors ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
          />
        ) : null}
        {children}
      </View>
    </View>
  );
}
