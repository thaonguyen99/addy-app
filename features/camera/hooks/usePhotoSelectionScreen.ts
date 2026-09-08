import { useCameraSession } from '@/features/camera/context/camera-session-context';
import { usePhotoSelection } from '@/features/camera/hooks/usePhotoSelection';
import { useCreatePinHandoffStore } from '@/features/create-pin/store/create-pin-handoff-store';
import { safeBack } from '@/lib/navigation/safe-router';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

export function usePhotoSelectionScreen() {
  const setHandoff = useCreatePinHandoffStore((s) => s.setHandoff);
  const { capturedPhotos } = useCameraSession();
  const {
    allPhotos,
    selectedIds,
    selectionKey,
    toggleSelection,
    selectedPhotos,
    pickFromGallery,
  } = usePhotoSelection(capturedPhotos);

  const [picking, setPicking] = useState(false);
  const [moodScore, setMoodScore] = useState<number | null>(null);
  const [feeling, setFeeling] = useState('');

  const pickFromGalleryWithFeedback = useCallback(async () => {
    setPicking(true);
    try {
      const res = await pickFromGallery();
      if (!res.ok && res.reason === 'permission_denied') {
        const message = res.canAskAgain
          ? 'Allow photo access when prompted, or enable it in Settings to pick from your gallery.'
          : 'Photo access is off for Addy. You can turn it on in Settings.';
        Alert.alert('Photo library', message, [{ text: 'OK' }]);
      }
    } finally {
      setPicking(false);
    }
  }, [pickFromGallery]);

  const confirmAndContinue = useCallback(() => {
    if (selectedPhotos.length === 0) {
      return;
    }
    setHandoff({
      images: selectedPhotos,
      moodScore: moodScore ?? null,
      feeling: feeling.trim(),
      selectedPlace: null,
    });
    router.push('/place-selection');
  }, [selectedPhotos, moodScore, feeling, setHandoff]);

  const goBack = useCallback(() => {
    safeBack('/(app)/(tabs)/camera');
  }, []);

  const canConfirm = selectedPhotos.length > 0;

  return {
    allPhotos,
    selectedIds,
    selectionKey,
    toggleSelection,
    selectedPhotos,
    picking,
    pickFromGalleryWithFeedback,
    confirmAndContinue,
    goBack,
    moodScore,
    setMoodScore,
    feeling,
    setFeeling,
    canConfirm,
  };
}
