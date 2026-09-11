import type { CameraType } from "expo-camera";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  CAMERA_SCREEN_HORIZONTAL_PADDING,
  SNAP_INNER_DIAMETER,
  SNAP_OUTER_DIAMETER,
} from "@/features/camera/constants/layout";
import { sharedInteractionStyles } from "@/features/camera/styles/shared-styles";
import type { AddyMemoryImage } from "@/types/addy-memory";

import { BrandColors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { CapturedImageStack } from "./CapturedImageStack";

export type CameraActionBarProps = Readonly<{
  capturedPhotos: readonly AddyMemoryImage[];
  onGalleryPress: () => void;
  onCapturePress: () => void;
  cameraFacing: CameraType;
  onFlipCameraPress: () => void;
  captureDisabled?: boolean;
}>;

function CameraActionBarInner({
  capturedPhotos,
  onGalleryPress,
  onCapturePress,
  cameraFacing,
  onFlipCameraPress,
  captureDisabled,
}: CameraActionBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 14);

  return (
    <View style={[styles.bar, { paddingBottom: bottomPad }]}>
      <View style={styles.col}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Review captures and open gallery"
          hitSlop={12}
          onPress={onGalleryPress}
          style={({ pressed }) => [
            styles.sideTap,
            pressed && sharedInteractionStyles.pressedMedium,
          ]}
        >
          <CapturedImageStack photos={capturedPhotos} />

          {/* <Text style={styles.caption} numberOfLines={2}>
            stacks
          </Text> */}
        </Pressable>
      </View>

      <View style={[styles.col, styles.colCenter]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Take photo"
          disabled={captureDisabled}
          onPress={onCapturePress}
          style={({ pressed }) => [
            styles.snapOuter,
            pressed && styles.snapPressed,
            captureDisabled && styles.snapDisabled,
          ]}
        >
          <View style={styles.snapInner} />
        </Pressable>
      </View>

      <View style={styles.col}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            cameraFacing === "back"
              ? "Switch to front camera"
              : "Switch to back camera"
          }
          hitSlop={12}
          onPress={onFlipCameraPress}
          style={({ pressed }) => [
            styles.sideTap,
            pressed && sharedInteractionStyles.pressedMedium,
          ]}
        >
          <View style={styles.flipCircle}>
            <Ionicons
              name="camera-reverse-outline"
              size={26}
              color={BrandColors.white}
            />
          </View>
        </Pressable>
      </View>
    </View>
  );
}

export const CameraActionBar = memo(CameraActionBarInner);

const styles = StyleSheet.create({
  bar: {
    backgroundColor: "rgba(43, 28, 33, 0.55)",
    paddingHorizontal: CAMERA_SCREEN_HORIZONTAL_PADDING,
    paddingTop: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  col: {
    flex: 1,
    alignItems: "center",
  },
  colCenter: {
    justifyContent: "flex-end",
    gap: 8,
    paddingBottom: 2,
  },
  sideTap: {
    alignItems: "center",
    gap: 6,
    maxWidth: 110,
  },
  caption: {
    fontSize: 10,
    letterSpacing: 0.2,
    color: BrandColors.white,
    textTransform: "lowercase",
    textAlign: "center",
    lineHeight: 13,
  },
  snapOuter: {
    width: SNAP_OUTER_DIAMETER,
    height: SNAP_OUTER_DIAMETER,
    borderRadius: SNAP_OUTER_DIAMETER / 2,
    borderWidth: 4,
    borderColor: BrandColors.white,
    backgroundColor: BrandColors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BrandColors.black,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  snapInner: {
    width: SNAP_INNER_DIAMETER,
    height: SNAP_INNER_DIAMETER,
    borderRadius: SNAP_INNER_DIAMETER / 2,
    backgroundColor: BrandColors.primary,
  },
  snapPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.92,
  },
  snapDisabled: {
    opacity: 0.45,
  },
  flipCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: BrandColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
});
