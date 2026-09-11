import type { CameraType, CameraView, FlashMode } from "expo-camera";
import { CameraView as ExpoCameraView } from "expo-camera";
import type { RefObject } from "react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CameraShutterFlash,
  type CameraShutterFlashRef,
} from "./camera-shutter-flash";

import { CameraUi } from "@/features/camera/constants/layout";
import type { AddyMemoryImage } from "@/types/addy-memory";

import { CameraActionBar } from "./CameraActionBar";
import { CameraFlashFab } from "./camera-flash-fab";
import { CameraZoomBar } from "./camera-zoom-bar";

export type AddyCameraViewProps = Readonly<{
  cameraRef: RefObject<CameraView | null>;
  capturedPhotos: readonly AddyMemoryImage[];
  isCapturing: boolean;
  onCameraReady: () => void;
  onCapture: () => void;
  onOpenSelection: () => void;
  flash: FlashMode;
  facing: CameraType;
  onFlipCamera: () => void;
  zoom: number;
  onCycleFlash: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onZoomSet: (normalizedZoom: number) => void;
}>;

function AddyCameraViewInner({
  cameraRef,
  capturedPhotos,
  isCapturing,
  onCameraReady,
  onCapture,
  onOpenSelection,
  flash,
  facing,
  onFlipCamera,
  zoom,
  onCycleFlash,
  onZoomOut,
  onZoomIn,
  onZoomSet,
}: AddyCameraViewProps) {
  const shutterFlashRef = useRef<CameraShutterFlashRef>(null);
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
    onCapture();
  }, [onCapture]);

  return (
    <View style={styles.root}>
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <ExpoCameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mode="picture"
          animateShutter
          flash={flash}
          zoom={zoom}
          onCameraReady={onCameraReady}
        />
        <GestureDetector gesture={pinchGesture}>
          <View style={StyleSheet.absoluteFillObject} collapsable={false} />
        </GestureDetector>
        <CameraShutterFlash ref={shutterFlashRef} />
      </GestureHandlerRootView>

      <SafeAreaView
        style={styles.overlay}
        edges={["top", "bottom"]}
        pointerEvents="box-none"
      >
        <View style={styles.topRow} pointerEvents="box-none">
          <CameraFlashFab flash={flash} onPress={onCycleFlash} />
        </View>

        <View style={styles.bottomStack} pointerEvents="box-none">
          <CameraZoomBar
            zoom={zoom}
            onZoomOut={onZoomOut}
            onZoomIn={onZoomIn}
            onZoomSet={onZoomSet}
          />
          <CameraActionBar
            capturedPhotos={capturedPhotos}
            onGalleryPress={onOpenSelection}
            cameraFacing={facing}
            onFlipCameraPress={onFlipCamera}
            onCapturePress={handleCapturePress}
            captureDisabled={isCapturing}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

export const AddyCameraView = memo(AddyCameraViewInner);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CameraUi.screenBg,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  topRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    alignItems: "flex-start",
  },
  bottomStack: {
    paddingBottom: 8,
  },
});
