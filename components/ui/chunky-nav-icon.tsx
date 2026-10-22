import { LinearGradient } from "expo-linear-gradient";
import { View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { SoftShadowBox } from "@/components/ui/soft-shadow";
import { accentCyanDeep, accentPinkDeep } from "@/constants/sticker-style";
import { BrandColors } from "@/constants/theme";

type ChunkyNavIconName = "house.fill" | "camera.fill" | "map.fill";

type ChunkyNavIconProps = {
  name: ChunkyNavIconName;
  active?: boolean;
  size?: number;
};

const NAV_ICON_GRADIENTS: Record<ChunkyNavIconName, [string, string]> = {
  "house.fill": [BrandColors.primaryLight, BrandColors.primary],
  "camera.fill": [BrandColors.accentCyan, accentCyanDeep],
  "map.fill": [BrandColors.accentPink, accentPinkDeep],
};

/** Chunky glossy rounded-square nav bar button — one per bottom tab. */
export function ChunkyNavIcon({
  name,
  active = false,
  size = 52,
}: ChunkyNavIconProps) {
  return (
    <View
      style={{
        opacity: active ? 1 : 0.55,
        transform: [{ scale: active ? 1 : 0.9 }],
      }}
    >
      <SoftShadowBox radius={size * 0.32}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size * 0.32,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={NAV_ICON_GRADIENTS[name]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconSymbol
              name={name}
              size={size * 0.5}
              color={BrandColors.ink}
            />
          </LinearGradient>
        </View>
      </SoftShadowBox>
    </View>
  );
}
