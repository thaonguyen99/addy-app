import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { StickerCard } from "@/components/ui/sticker-card";
import { BrandColors } from "@/constants/theme";
import { StickerRadius } from "@/constants/sticker-style";
import type { PlaceSuggestion } from "@/types/api";

type PlaceSuggestionRowProps = Readonly<{
  place: PlaceSuggestion;
  selected: boolean;
  onPress: (place: PlaceSuggestion) => void;
}>;

export function PlaceSuggestionRow({
  place,
  selected,
  onPress,
}: PlaceSuggestionRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onPress(place)}
      style={({ pressed }) => [pressed && styles.rowPressed]}
    >
      <StickerCard
        radius={StickerRadius.button}
        backgroundColor={selected ? BrandColors.primaryMuted : BrandColors.paper}
        shadowOffset={2}
      >
        <View style={styles.row}>
          <View style={styles.textWrap}>
            <Text style={styles.name} numberOfLines={1}>
              {place.name}
            </Text>
            <Text style={styles.address} numberOfLines={2}>
              {place.address}
            </Text>
          </View>
          {selected ? (
            <MaterialIcons
              name="check-circle"
              size={22}
              color={BrandColors.primary}
            />
          ) : (
            <View style={styles.checkPlaceholder} />
          )}
        </View>
      </StickerCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  rowPressed: {
    opacity: 0.9,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: BrandColors.ink,
  },
  address: {
    fontSize: 13,
    color: BrandColors.inkMuted,
    lineHeight: 18,
  },
  checkPlaceholder: {
    width: 22,
    height: 22,
  },
});
