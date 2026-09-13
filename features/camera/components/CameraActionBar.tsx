import type { CameraType } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  CAMERA_SCREEN_HORIZONTAL_PADDING,
  SNAP_INNER_DIAMETER,
  SNAP_OUTER_DIAMETER,
} from "@/features/camera/constants/layout";
import { sharedInteractionStyles } from "@/features/camera/styles/shared-styles";
import type { AddyMemoryImage } from "@/types/addy-memory";

import { BrandColors } from "@/constants/theme";
import { StickerBorderWidth, accentCyanDeep } from "@/constants/sticker-style";
import { StickerShadowBox } from "@/components/ui/sticker-shadow";
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
  return (
    <View style={styles.bar}>
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
            pressed && styles.snapPressed,
            captureDisabled && styles.snapDisabled,
          ]}
        >
          <StickerShadowBox radius={SNAP_OUTER_DIAMETER / 2} style={styles.snapShadow}>
            <View style={styles.snapOuter}>
              <LinearGradient
                colors={["#FFFFFF", BrandColors.primaryLight, BrandColors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.snapInner}
              />
            </View>
          </StickerShadowBox>
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
          <StickerShadowBox radius={23} style={styles.flipShadow}>
            <LinearGradient
              colors={[BrandColors.accentCyan, accentCyanDeep]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.flipCircle}
            >
              <Ionicons
                name="camera-reverse-outline"
                size={26}
                color={BrandColors.ink}
              />
            </LinearGradient>
          </StickerShadowBox>
        </Pressable>
      </View>
    </View>
  );
}

export const CameraActionBar = memo(CameraActionBarInner);

const styles = StyleSheet.create({
  bar: {
    backgroundColor: "rgba(22, 23, 26, 0.55)",
    paddingHorizontal: CAMERA_SCREEN_HORIZONTAL_PADDING,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
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
  snapShadow: {
    width: SNAP_OUTER_DIAMETER,
    height: SNAP_OUTER_DIAMETER,
  },
  snapOuter: {
    flex: 1,
    borderRadius: SNAP_OUTER_DIAMETER / 2,
    borderWidth: 4,
    borderColor: BrandColors.ink,
    backgroundColor: BrandColors.paper,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  snapInner: {
    width: SNAP_INNER_DIAMETER,
    height: SNAP_INNER_DIAMETER,
    borderRadius: SNAP_INNER_DIAMETER / 2,
  },
  snapPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.92,
  },
  snapDisabled: {
    opacity: 0.45,
  },
  flipShadow: {
    width: 46,
    height: 46,
  },
  flipCircle: {
    flex: 1,
    borderRadius: 23,
    borderWidth: StickerBorderWidth.thin,
    borderColor: BrandColors.ink,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
