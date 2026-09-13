import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { StickerCard } from "@/components/ui/sticker-card";
import { BrandColors } from "@/constants/theme";
import { StickerBorderWidth, StickerRadius } from "@/constants/sticker-style";

type StatChipProps = {
  value: string | number;
  label: string;
  style?: StyleProp<ViewStyle>;
};

/** Small inline stat pill — deliberately secondary, never a hero element. */
export function StatChip({ value, label, style }: StatChipProps) {
  return (
    <StickerCard
      style={style}
      radius={StickerRadius.chip}
      borderWidth={StickerBorderWidth.thin}
      backgroundColor={BrandColors.gray100}
      shadowOffset={2}
    >
      <View style={styles.content}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </StickerCard>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  value: {
    fontFamily: "VT323-Regular",
    fontSize: 20,
    color: BrandColors.ink,
  },
  label: {
    fontFamily: "VT323-Regular",
    fontSize: 16,
    color: BrandColors.inkMuted,
  },
});
