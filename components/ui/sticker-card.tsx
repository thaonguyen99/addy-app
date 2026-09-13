import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import { StickerShadowBox } from "@/components/ui/sticker-shadow";
import { BrandColors } from "@/constants/theme";
import {
  STICKER_SHADOW_OFFSET,
  StickerBorderWidth,
  StickerRadius,
} from "@/constants/sticker-style";

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
  shadowOffset?: number;
};

/**
 * Base "sticker" building block: rounded rect, ink outline, hard shadow,
 * paper (or gradient) fill. Composes StickerShadowBox for the shadow.
 */
export function StickerCard({
  children,
  style,
  radius = StickerRadius.card,
  borderWidth = StickerBorderWidth.standard,
  borderColor = BrandColors.ink,
  borderStyle = "solid",
  backgroundColor = BrandColors.paper,
  gradientColors,
  shadow = true,
  shadowOffset = STICKER_SHADOW_OFFSET,
}: StickerCardProps) {
  return (
    <StickerShadowBox
      radius={radius}
      shadowOffset={shadowOffset}
      enabled={shadow}
      style={style}
    >
      <View
        style={{
          borderWidth,
          borderColor,
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
    </StickerShadowBox>
  );
}
