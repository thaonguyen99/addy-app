import { ReactNode } from "react";
import { Platform, StyleProp, View, ViewStyle } from "react-native";

import { BrandColors } from "@/constants/theme";
import { STICKER_SHADOW_OFFSET } from "@/constants/sticker-style";

type StickerShadowBoxProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  shadowColor?: string;
  shadowOffset?: number;
  enabled?: boolean;
};

/**
 * Flat, offset "sticker" shadow — never blurred. iOS/web get this for free
 * from RN's shadow props with `shadowRadius: 0`; Android's `elevation` has
 * no flat mode, so it's faked with a second, offset background View.
 */
export function StickerShadowBox({
  children,
  style,
  radius = 0,
  shadowColor = BrandColors.ink,
  shadowOffset = STICKER_SHADOW_OFFSET,
  enabled = true,
}: StickerShadowBoxProps) {
  if (!enabled) {
    return <View style={style}>{children}</View>;
  }

  if (Platform.OS === "android") {
    return (
      <View style={style}>
        <View
          style={{
            position: "absolute",
            // Same footprint as the content, shifted — matches iOS, where the
            // shadow pokes out past the bottom-right edge instead of hiding
            // behind the content.
            left: shadowOffset,
            top: shadowOffset,
            right: -shadowOffset,
            bottom: -shadowOffset,
            backgroundColor: shadowColor,
            borderRadius: radius,
          }}
        />
        {/* flexGrow so `flex: 1` children fill a fixed-size box (e.g. the
            camera buttons) instead of collapsing to 0 height. */}
        <View style={{ flexGrow: 1, zIndex: 1 }}>{children}</View>
      </View>
    );
  }

  return (
    <View
      style={[
        {
          shadowColor,
          shadowOffset: { width: shadowOffset, height: shadowOffset },
          shadowOpacity: 1,
          shadowRadius: 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
