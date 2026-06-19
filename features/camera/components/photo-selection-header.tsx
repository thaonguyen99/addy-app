import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { memo } from "react";
import { ActivityIndicator, Pressable, StyleSheet } from "react-native";

import { BrandColors } from "@/constants/theme";
import { sharedInteractionStyles } from "@/features/camera/styles/shared-styles";

export type PhotoSelectionGalleryButtonProps = Readonly<{
  picking: boolean;
  onPickFromGallery: () => void;
}>;

export const PhotoSelectionGalleryButton = memo(
  function PhotoSelectionGalleryButton({
    picking,
    onPickFromGallery,
  }: PhotoSelectionGalleryButtonProps) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add from gallery"
        onPress={onPickFromGallery}
        disabled={picking}
        style={({ pressed }) => [
          styles.galleryBtn,
          pressed && !picking && sharedInteractionStyles.pressedSubtle,
        ]}
      >
        {picking ? (
          <ActivityIndicator color={BrandColors.primaryPink} size="small" />
        ) : (
          <MaterialIcons
            name="add-photo-alternate"
            size={22}
            color={BrandColors.gray100}
          />
        )}
      </Pressable>
    );
  },
);

const styles = StyleSheet.create({
  galleryBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: BrandColors.gray800,
    borderWidth: 1,
    borderColor: BrandColors.gray700,
  },
});
