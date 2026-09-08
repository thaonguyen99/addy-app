import {
  CAMERA_FRAME_MAX_SIZE,
  CAMERA_SCREEN_HORIZONTAL_PADDING,
} from '@/features/camera/constants/layout';
import { useCameraSession } from '@/features/camera/context/camera-session-context';
import { useAddyCamera } from '@/features/camera/hooks/useAddyCamera';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { Linking, useWindowDimensions } from 'react-native';

export function useAddyCameraScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { addCapturedPhotoFromUri, capturedPhotos } = useCameraSession();
  const {
    cameraRef,
    gate,
    requestPermission,
    refreshPermission,
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
    // photo-selection / place-selection / create-pin all live on the root (app)
    // stack so one dismissAll() after save closes the whole flow at once.
    router.push('/photo-selection');
  }, []);

  const captureAndStore = useCallback(async () => {
    const uri = await capturePhoto();
    if (uri) {
      await addCapturedPhotoFromUri(uri);
    }
  }, [capturePhoto, addCapturedPhotoFromUri]);

  // Keep the gate fresh when returning to the screen — e.g. after the user
  // toggled the permission in the OS settings app.
  useFocusEffect(
    useCallback(() => {
      void refreshPermission();
    }, [refreshPermission])
  );

  const requestCameraAccess = useCallback(async () => {
    const result = await requestPermission();
    // On Android, once the permission is permanently denied the OS silently
    // resolves the request without showing a dialog. Send the user to the
    // system settings screen so they can still enable it.
    if (!result.granted && !result.canAskAgain) {
      await Linking.openSettings();
    }
  }, [requestPermission]);

  const openAppSettings = useCallback(() => {
    void Linking.openSettings();
  }, []);

  return {
    cameraRef,
    gate,
    requestCameraAccess,
    openAppSettings,
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
