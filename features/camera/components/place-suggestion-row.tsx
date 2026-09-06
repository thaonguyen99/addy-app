import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BrandColors } from "@/constants/theme";
import { cameraLayout } from "@/features/camera/styles/shared-styles";
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
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        pressed && styles.rowPressed,
      ]}
    >
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
    borderRadius: cameraLayout.cornerRadiusMd,
    borderWidth: 1,
    borderColor: BrandColors.neutralBorder,
    backgroundColor: BrandColors.secondary,
  },
  rowSelected: {
    borderColor: BrandColors.primary,
    backgroundColor: BrandColors.primaryMuted,
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
    color: BrandColors.neutral,
  },
  address: {
    fontSize: 13,
    color: BrandColors.neutralMuted,
    lineHeight: 18,
  },
  checkPlaceholder: {
    width: 22,
    height: 22,
  },
});
