import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import type { FlashMode } from "expo-camera";
import type { ComponentProps } from "react";
import { memo } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

import { BrandColors } from "@/constants/theme";
import { sharedInteractionStyles } from "@/features/camera/styles/shared-styles";

export type CameraFlashFabProps = Readonly<{
  flash: FlashMode;
  onPress: () => void;
}>;

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

const FAB_SIZE = 44;

/** Depth under the glass pill (native). */
const hostShadowStyle: ViewStyle =
  Platform.OS === "ios"
    ? {
        shadowColor: BrandColors.black,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.28,
        shadowRadius: 6,
      }
    : Platform.OS === "android"
      ? { elevation: 8 }
      : {};

/** Safari / Chrome: frosted panel when BlurView is not used. */
const webBackdropBlur =
  Platform.OS === "web"
    ? ({
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      } as ViewStyle)
    : undefined;

function flashIcon(flash: FlashMode): MaterialIconName {
  if (flash === "on") return "flash-on";
  if (flash === "auto") return "flash-auto";
  return "flash-off";
}

function CameraFlashFabInner({ flash, onPress }: CameraFlashFabProps) {
  const icon = flashIcon(flash);
  const label =
    flash === "on" ? "Flash on" : flash === "auto" ? "Flash auto" : "Flash off";

  const glassFrost = (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.glassFrost]}
    />
  );

  const glassRim = (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.glassRim]}
    />
  );

  const button = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [
        styles.inner,
        pressed && sharedInteractionStyles.pressedMedium,
      ]}
    >
      <MaterialIcons name={icon} size={22} color={BrandColors.white} />
    </Pressable>
  );

  if (Platform.OS === "web") {
    return (
      <View
        style={[styles.host, hostShadowStyle, styles.webGlass, webBackdropBlur]}
      >
        {glassFrost}
        {glassRim}
        {button}
      </View>
    );
  }

  return (
    <BlurView
      intensity={Platform.OS === "ios" ? 55 : 72}
      tint={Platform.OS === "ios" ? "systemThinMaterialDark" : "dark"}
      blurReductionFactor={Platform.OS === "android" ? 3 : 4}
      style={[styles.host, hostShadowStyle]}
    >
      {glassFrost}
      {glassRim}
      {button}
    </BlurView>
  );
}

export const CameraFlashFab = memo(CameraFlashFabInner);

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: 10,
    top: 10,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BrandColors.stroke3,
  },
  /** Milky frost on top of blur for a clearer “glass” read. */
  glassFrost: {
    backgroundColor: BrandColors.stroke2,
  },
  /** Soft inner edge (specular hint). */
  glassRim: {
    borderRadius: FAB_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: BrandColors.stroke3,
  },
  webGlass: {
    backgroundColor: "rgba(43, 28, 33, 0.38)",
  },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
