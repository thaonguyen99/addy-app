import type { CameraType, CameraView, FlashMode } from "expo-camera";
import { CameraView as ExpoCameraView } from "expo-camera";
import type { RefObject } from "react";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import {
  CameraShutterFlash,
  type CameraShutterFlashRef,
} from "./camera-shutter-flash";
import { StyleSheet, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { CameraUi } from "@/features/camera/constants/layout";
import { cameraLayout } from "@/features/camera/styles/shared-styles";
import type { AddyMemoryImage } from "@/types/addy-memory";

import { BrandColors } from "@/constants/theme";
import { CameraActionBar } from "./CameraActionBar";
import { CameraFlashFab } from "./camera-flash-fab";
import { CameraZoomBar } from "./camera-zoom-bar";

export type AddyCameraViewProps = Readonly<{
  cameraRef: RefObject<CameraView | null>;
  frameSize: number;
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
  frameSize,
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
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.body}>
        <View style={styles.cameraArea}>
          <View style={[styles.previewColumn, { width: frameSize }]}>
            <View
              style={[
                styles.squareFrame,
                { width: frameSize, height: (frameSize * 5) / 4 },
              ]}
            >
              <GestureHandlerRootView style={styles.gestureRoot}>
                <ExpoCameraView
                  ref={cameraRef}
                  style={StyleSheet.absoluteFill}
                  facing={facing}
                  mode="picture"
                  ratio="1:1"
                  animateShutter
                  flash={flash}
                  zoom={zoom}
                  onCameraReady={onCameraReady}
                />
                <GestureDetector gesture={pinchGesture}>
                  <View style={styles.pinchOverlay} collapsable={false} />
                </GestureDetector>
                <CameraFlashFab flash={flash} onPress={onCycleFlash} />
                <CameraShutterFlash ref={shutterFlashRef} />
              </GestureHandlerRootView>
            </View>
            <CameraZoomBar
              zoom={zoom}
              onZoomOut={onZoomOut}
              onZoomIn={onZoomIn}
              onZoomSet={onZoomSet}
            />
          </View>
        </View>

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
  );
}

export const AddyCameraView = memo(AddyCameraViewInner);

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: CameraUi.screenBg,
  },
  body: {
    flex: 1,
    justifyContent: "space-between",
  },
  cameraArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
  },
  previewColumn: {
    alignItems: "stretch",
  },
  squareFrame: {
    position: "relative",
    borderRadius: cameraLayout.cornerRadiusLg,
    overflow: "hidden",
    backgroundColor: BrandColors.gray900,
    borderWidth: 1,
    borderColor: BrandColors.neutralBorder,
  },
  gestureRoot: {
    flex: 1,
  },
  pinchOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
