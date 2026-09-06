import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { memo } from "react";
import { StyleSheet, TextInput, View } from "react-native";

import { BrandColors } from "@/constants/theme";
import { cameraLayout } from "@/features/camera/styles/shared-styles";

export type PhotoSelectionPlaceSearchProps = Readonly<{
  value: string;
  onChangeText: (text: string) => void;
}>;

export const PhotoSelectionPlaceSearch = memo(function PhotoSelectionPlaceSearch({
  value,
  onChangeText,
}: PhotoSelectionPlaceSearchProps) {
  return (
    <View style={styles.wrap}>
      <MaterialIcons
        name="search"
        size={20}
        color={BrandColors.neutralMuted}
        style={styles.icon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Venue name (optional)"
        placeholderTextColor={BrandColors.neutralMuted}
        style={styles.input}
        autoCorrect={false}
        returnKeyType="search"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BrandColors.neutralBorder,
    borderRadius: cameraLayout.cornerRadiusMd,
    backgroundColor: BrandColors.secondary,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: BrandColors.neutral,
    paddingVertical: 10,
  },
});
