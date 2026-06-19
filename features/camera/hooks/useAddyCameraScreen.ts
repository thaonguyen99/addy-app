import {
  CAMERA_FRAME_MAX_SIZE,
  CAMERA_SCREEN_HORIZONTAL_PADDING,
} from '@/features/camera/constants/layout';
import { useCameraSession } from '@/features/camera/context/camera-session-context';
import { useAddyCamera } from '@/features/camera/hooks/useAddyCamera';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { useWindowDimensions } from 'react-native';

export function useAddyCameraScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { addCapturedPhotoFromUri, capturedPhotos } = useCameraSession();
  const {
    cameraRef,
    gate,
    requestPermission,
    onCameraReady,
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
  } = useAddyCamera();

  const frameSize = Math.min(
    screenWidth - CAMERA_SCREEN_HORIZONTAL_PADDING * 2,
    CAMERA_FRAME_MAX_SIZE
  );

  const openPhotoSelection = useCallback(() => {
    // Relative `./photo-selection` can resolve from the tabs segment and become an
    // unmatched route; `/camera/photo-selection` matches `app/(tabs)/camera/photo-selection`.
    router.push('/camera/photo-selection');
  }, []);

  const captureAndStore = useCallback(async () => {
    const uri = await capturePhoto();
    if (uri) {
      await addCapturedPhotoFromUri(uri);
    }
  }, [capturePhoto, addCapturedPhotoFromUri]);

  const requestCameraAccess = useCallback(() => {
    void requestPermission();
  }, [requestPermission]);

  return {
    cameraRef,
    gate,
    requestCameraAccess,
    onCameraReady,
    frameSize,
    capturedPhotos,
    isCapturing,
    openPhotoSelection,
    captureAndStore,
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
