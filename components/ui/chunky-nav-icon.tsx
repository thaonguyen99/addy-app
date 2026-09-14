import { View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { StickerCard } from "@/components/ui/sticker-card";
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
      <StickerCard
        radius={size * 0.32}
        gradientColors={NAV_ICON_GRADIENTS[name]}
        shadowOffset={active ? 3 : 2}
      >
        <View
          style={{
            width: size,
            height: size,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconSymbol name={name} size={size * 0.5} color={BrandColors.ink} />
        </View>
      </StickerCard>
    </View>
  );
}
