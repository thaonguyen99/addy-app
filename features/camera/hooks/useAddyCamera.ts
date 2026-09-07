import { CAMERA_ZOOM_STEP } from '@/features/camera/constants/layout';
import { useCameraPermissionGate } from '@/features/camera/permissions/use-camera-permission-gate';
import type { CameraType, CameraView, FlashMode } from 'expo-camera';
import { useCallback, useRef, useState } from 'react';

const CAPTURE_QUALITY = 0.92;

const FLASH_CYCLE: readonly FlashMode[] = ['off', 'on', 'auto'];

export function useAddyCamera() {
  const cameraRef = useRef<CameraView | null>(null);
  const { gate, requestPermission, refreshPermission } = useCameraPermissionGate();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [flash, setFlash] = useState<FlashMode>('off');
  const [facing, setFacing] = useState<CameraType>('back');
  const [zoom, setZoom] = useState(0);

  const onCameraReady = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  const cycleFlash = useCallback(() => {
    setFlash((prev) => {
      const i = FLASH_CYCLE.indexOf(prev);
      const next = FLASH_CYCLE[(i + 1) % FLASH_CYCLE.length];
      return next;
    });
  }, []);

  const flipCamera = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const nudgeZoom = useCallback((delta: number) => {
    setZoom((z) => Math.min(1, Math.max(0, z + delta * CAMERA_ZOOM_STEP)));
  }, []);

  const zoomOut = useCallback(() => {
    nudgeZoom(-1);
  }, [nudgeZoom]);

  const zoomIn = useCallback(() => {
    nudgeZoom(1);
  }, [nudgeZoom]);

  const setZoomNormalized = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    setZoom(clamped);
  }, []);

  const capturePhoto = useCallback(async (): Promise<string | null> => {
    const cam = cameraRef.current;
    if (!cam || !isCameraReady) {
      return null;
    }
    setIsCapturing(true);
    try {
      const photo = await cam.takePictureAsync({
        quality: CAPTURE_QUALITY,
        shutterSound: true,
      });
      return photo?.uri ?? null;
    } catch {
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, [isCameraReady]);

  return {
    cameraRef,
    gate,
    requestPermission,
    refreshPermission,
    onCameraReady,
    isCameraReady,
    capturePhoto,
    isCapturing,
    flash,
    facing,
    flipCamera,
    zoom,
    cycleFlash,
    zoomOut,
    zoomIn,
    setZoomNormalized,
  };
}
