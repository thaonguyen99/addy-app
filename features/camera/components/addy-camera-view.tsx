import { MaterialIcons } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { TourTarget } from "@wrack/react-native-tour-guide";
import type { CameraType, CameraView, FlashMode } from "expo-camera";
import { CameraView as ExpoCameraView } from "expo-camera";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import type { ComponentProps, RefObject } from "react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlossyOrb } from "@/components/ui/glossy-orb";
import { TechChip } from "@/components/ui/tech-chip";
import { AddyColors } from "@/constants/theme";
import { CameraZoomChips } from "@/features/camera/components/camera-zoom-chips";
import { useLastLibraryPhoto } from "@/hooks/use-last-library-photo";
import { useCameraShutterSound } from "@/hooks/use-camera-shutter-sound";
import { ONBOARDING_ADD_MEMORY_STEP_ID } from "@/features/onboarding/onboarding-tour";
import { useOnboardingCaptureStore } from "@/stores/onboarding-capture.store";

import {
  CameraShutterFlash,
  type CameraShutterFlashRef,
} from "./camera-shutter-flash";

const SIDE_PADDING = 16;
const VIEWFINDER_RADIUS = 18;
const SHUTTER_SIZE = 66;
const SHUTTER_RING = 4;
const BRACKET = 22;

export type AddyCameraViewProps = Readonly<{
  cameraRef: RefObject<CameraView | null>;
  isBusy: boolean;
  onCameraReady: () => void;
  onCapture: () => void;
  onOpenGallery: () => void;
  onClose: () => void;
  flash: FlashMode;
  onCycleFlash: () => void;
  facing: CameraType;
  onFlipCamera: () => void;
  zoom: number;
  onZoomSet: (normalizedZoom: number) => void;
  availableLenses: readonly string[];
  selectedLens: string | undefined;
  onSelectLens: (lens: string | undefined) => void;
  onAvailableLensesChanged: (event: { lenses: string[] }) => void;
}>;

type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

function flashIcon(flash: FlashMode): MaterialIconName {
  if (flash === "on") return "flash-on";
  if (flash === "auto") return "flash-auto";
  return "flash-off";
}

/** Translucent circle control for the dark capture screen (44px touch target). */
function GhostButton({
  onPress,
  accessibilityLabel,
  children,
  size = 40,
  disabled,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
  size?: number;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={Math.max(0, (44 - size) / 2)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.ghost,
        { width: size, height: size, borderRadius: size / 2 },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {children}
    </Pressable>
  );
}

function ViewfinderOverlay() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Rule-of-thirds grid. */}
      <View style={[styles.gridLine, styles.gridV, { left: "33.333%" }]} />
      <View style={[styles.gridLine, styles.gridV, { left: "66.666%" }]} />
      <View style={[styles.gridLine, styles.gridH, { top: "33.333%" }]} />
      <View style={[styles.gridLine, styles.gridH, { top: "66.666%" }]} />
      {/* Corner brackets. */}
      <View style={[styles.bracket, styles.bracketTL]} />
      <View style={[styles.bracket, styles.bracketTR]} />
      <View style={[styles.bracket, styles.bracketBL]} />
      <View style={[styles.bracket, styles.bracketBR]} />
      {/* <View style={styles.ratioLabel}>
        <TechChip label="1:1" tone="ghost" size="sm" />
      </View> */}
    </View>
  );
}

function AddyCameraViewInner({
  cameraRef,
  isBusy,
  onCameraReady,
  onCapture,
  onOpenGallery,
  onClose,
  flash,
  onCycleFlash,
  facing,
  onFlipCamera,
  zoom,
  onZoomSet,
  availableLenses,
  selectedLens,
  onSelectLens,
  onAvailableLensesChanged,
}: AddyCameraViewProps) {
  const { width } = useWindowDimensions();
  const viewfinderSize = width - SIDE_PADDING * 2;
  const shutterFlashRef = useRef<CameraShutterFlashRef>(null);
  const playShutterSound = useCameraShutterSound();
  const lastPhoto = useLastLibraryPhoto();
  const zoomRef = useRef(zoom);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  const pinchBaseRef = useRef(0);

  const markPinchBase = useCallback(() => {
    pinchBaseRef.current = zoomRef.current;
  }, []);

  const applyPinchScale = useCallback(
    (scale: number) => {
      const z0 = pinchBaseRef.current;
      const display0 = 1 + 4 * z0;
      const display = Math.min(5, Math.max(1, display0 * scale));
      onZoomSet((display - 1) / 4);
    },
    [onZoomSet],
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .onStart(() => {
          runOnJS(markPinchBase)();
        })
        .onUpdate((e) => {
          runOnJS(applyPinchScale)(e.scale);
        }),
    [markPinchBase, applyPinchScale],
  );

  const handleCapturePress = useCallback(() => {
    shutterFlashRef.current?.play();
    void playShutterSound();
    onCapture();
  }, [onCapture, playShutterSound]);

  // The onboarding tour's shutter spotlight swallows the tap — it asks for
  // the capture here instead (see onboarding-tour.ts).
  const captureRequestId = useOnboardingCaptureStore((s) => s.captureRequestId);
  const handledCaptureRequestRef = useRef(captureRequestId);
  useEffect(() => {
    if (captureRequestId === handledCaptureRequestRef.current) return;
    handledCaptureRequestRef.current = captureRequestId;
    handleCapturePress();
  }, [captureRequestId, handleCapturePress]);

  const flashLabel =
    flash === "on" ? "Flash on" : flash === "auto" ? "Flash auto" : "Flash off";

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topRow}>
          <GhostButton onPress={onClose} accessibilityLabel="Close camera">
            <Ionicons name="close" size={22} color={AddyColors.white} />
          </GhostButton>
          <TechChip label="quick snap" leading="⚡" tone="ghost" />
          <GhostButton onPress={onCycleFlash} accessibilityLabel={flashLabel}>
            <MaterialIcons
              name={flashIcon(flash)}
              size={20}
              color={flash === "off" ? AddyColors.white : AddyColors.yellow}
            />
          </GhostButton>
        </View>

        <View style={styles.middle}>
          <View
            style={[
              styles.viewfinder,
              { width: viewfinderSize, height: viewfinderSize },
            ]}
          >
            <ExpoCameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={facing}
              // The front preview is mirrored; without this the saved selfie
              // comes out flipped relative to what the user just saw.
              mirror
              mode="picture"
              animateShutter
              flash={flash}
              zoom={zoom}
              selectedLens={selectedLens}
              onAvailableLensesChanged={onAvailableLensesChanged}
              onCameraReady={onCameraReady}
            />
            <GestureDetector gesture={pinchGesture}>
              <View style={StyleSheet.absoluteFill} collapsable={false} />
            </GestureDetector>
            <ViewfinderOverlay />
            <CameraShutterFlash ref={shutterFlashRef} />
          </View>

          <CameraZoomChips
            facing={facing}
            zoom={zoom}
            onZoomSet={onZoomSet}
            availableLenses={availableLenses}
            selectedLens={selectedLens}
            onSelectLens={onSelectLens}
          />
        </View>

        <View style={styles.controls}>
          <Pressable
            onPress={onOpenGallery}
            disabled={isBusy}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Pick photos from your gallery"
            style={({ pressed }) => [
              styles.galleryTile,
              pressed && styles.pressed,
              isBusy && styles.disabled,
            ]}
          >
            {lastPhoto ? (
              <Image
                source={{ uri: lastPhoto }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <Ionicons
                name="images-outline"
                size={22}
                color={AddyColors.white}
              />
            )}
          </Pressable>

          <TourTarget id={ONBOARDING_ADD_MEMORY_STEP_ID}>
            <Pressable
              onPress={handleCapturePress}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel="Take photo"
              style={({ pressed }) => [
                pressed && styles.shutterPressed,
                isBusy && styles.disabled,
              ]}
            >
              <GlossyOrb size={SHUTTER_SIZE} ringWidth={SHUTTER_RING} />
            </Pressable>
          </TourTarget>

          <GhostButton
            size={48}
            onPress={onFlipCamera}
            disabled={isBusy}
            accessibilityLabel={
              facing === "back"
                ? "Switch to front camera"
                : "Switch to back camera"
            }
          >
            <Ionicons
              name="camera-reverse-outline"
              size={24}
              color={AddyColors.white}
            />
          </GhostButton>
        </View>
      </SafeAreaView>
    </View>
  );
}

export const AddyCameraView = memo(AddyCameraViewInner);

const GHOST_BG = "rgba(255, 255, 255, 0.12)";
const GHOST_BORDER = "rgba(255, 255, 255, 0.24)";

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AddyColors.captureBg },
  safe: { flex: 1 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 8,
  },
  middle: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  viewfinder: {
    borderRadius: VIEWFINDER_RADIUS,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  gridV: { top: 0, bottom: 0, width: StyleSheet.hairlineWidth },
  gridH: { left: 0, right: 0, height: StyleSheet.hairlineWidth },
  bracket: {
    position: "absolute",
    width: BRACKET,
    height: BRACKET,
    borderColor: AddyColors.white,
  },
  bracketTL: {
    top: 12,
    left: 12,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 8,
  },
  bracketTR: {
    top: 12,
    right: 12,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 8,
  },
  bracketBL: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 8,
  },
  bracketBR: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 8,
  },
  ratioLabel: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 36,
    paddingTop: 8,
    paddingBottom: 56,
  },
  galleryTile: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: GHOST_BG,
    borderWidth: 1.5,
    borderColor: GHOST_BORDER,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ghost: {
    backgroundColor: GHOST_BG,
    borderWidth: 1.5,
    borderColor: GHOST_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterPressed: { transform: [{ scale: 0.95 }] },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.45 },
});
