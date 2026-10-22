import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

import { BrandColors } from "@/constants/theme";

type SoftShadowBoxProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
};

/**
 * Soft, blurred shadow for rounded-rect/pill/circle surfaces (chips, FABs,
 * bubbles, nav icons). Not for the SVG pin body — an SVG path's silhouette
 * doesn't get a path-shaped shadow from these props on Android.
 */
export function SoftShadowBox({ children, style, radius = 16 }: SoftShadowBoxProps) {
  return (
    <View
      style={[
        {
          borderRadius: radius,
          shadowColor: BrandColors.ink,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 4,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
