import { useCameraSession } from '@/features/camera/camera-session-context';
import { useAddyCamera } from '@/hooks/use-addy-camera';
import { useGalleryPick } from '@/hooks/use-gallery-pick';
import { cropCenterSquare } from '@/utils/crop-square';
import { startCreateFlow } from '@/features/create-pin/start-create-flow';
import { ONBOARDING_TOUR_ID } from '@/features/onboarding/onboarding-tour';
import { useFocusEffect } from '@react-navigation/native';
import { useTourGuide } from '@wrack/react-native-tour-guide';
import { useCallback, useState } from 'react';
import { Alert, Linking } from 'react-native';

export function useAddyCameraScreen() {
  const { addCapturedPhotoFromUri } = useCameraSession();
  const camera = useAddyCamera();
  const { capturePhoto, requestPermission, refreshPermission } = camera;
  const { pick, picking } = useGalleryPick();
  const [isProcessing, setIsProcessing] = useState(false);

  const { pauseTour, activeTourId } = useTourGuide();

  // Hide the onboarding spotlight while the user goes through the create
  // flow — it resumes and advances once a pin is actually saved (see
  // navigate-after-onboarding-pin).
  useFocusEffect(
    useCallback(() => {
      if (activeTourId === ONBOARDING_TOUR_ID) {
        pauseTour();
      }
    }, [activeTourId, pauseTour])
  );

  /** One press = one square photo = straight into create. */
  const captureAndCreate = useCallback(async () => {
    const uri = await capturePhoto();
    if (!uri) return;
    setIsProcessing(true);
    try {
      const image = await addCapturedPhotoFromUri(await cropCenterSquare(uri));
      startCreateFlow([image]);
    } catch (error) {
      console.warn('[camera] could not prepare photo', error);
      Alert.alert('Camera', "Couldn't save that photo. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [capturePhoto, addCapturedPhotoFromUri]);

  // Quick snap is one photo; uploading from the gallery can bring several.
  const pickFromGalleryAndCreate = useCallback(async () => {
    const images = await pick();
    startCreateFlow(images);
  }, [pick]);

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
    ...camera,
    isBusy: camera.isCapturing || isProcessing || picking,
    requestCameraAccess,
    openAppSettings,
    captureAndCreate,
    pickFromGalleryAndCreate,
  };
}
