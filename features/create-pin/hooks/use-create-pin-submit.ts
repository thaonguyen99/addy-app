import { useState } from "react";
import { Alert } from "react-native";

import { useCameraSession } from "@/features/camera/context/camera-session-context";
import { navigateAfterCreatePin } from "@/features/create-pin/navigate-after-create-pin";
import { useCreatePinHandoffStore } from "@/features/create-pin/store/create-pin-handoff-store";
import { removeDraftImages } from "@/features/drafts/draft-image-storage";
import { placeSuggestionToPlaceInput } from "@/features/location/place-input";
import { toApiClientError } from "@/lib/api/errors";
import {
  useCreateMemoryMutation,
  useUploadImagesMutation,
} from "@/lib/query/hooks";
import type { AddyMemoryImage } from "@/types/addy-memory";

export function useCreatePinSubmit(images: readonly AddyMemoryImage[]) {
  const [submitting, setSubmitting] = useState(false);
  const uploadMutation = useUploadImagesMutation();
  const createMutation = useCreateMemoryMutation();
  const clearHandoff = useCreatePinHandoffStore((s) => s.clear);
  const moodScore = useCreatePinHandoffStore((s) => s.moodScore);
  const handoffFeeling = useCreatePinHandoffStore((s) => s.feeling);
  const selectedPlace = useCreatePinHandoffStore((s) => s.selectedPlace);
  const { clearSession, reloadDrafts } = useCameraSession();

  const submit = async () => {
    if (images.length === 0) {
      Alert.alert("Create pin", "Select at least one photo.");
      return null;
    }

    if (!selectedPlace) {
      Alert.alert("Create pin", "Select a place for this memory.");
      return null;
    }

    setSubmitting(true);
    const cover = images[0];

    try {
      const uploadedImages = await uploadMutation.mutateAsync(
        images.map((image) => image.uri),
      );

      const memory = await createMutation.mutateAsync({
        place: placeSuggestionToPlaceInput(selectedPlace),
        images: uploadedImages.map((uploaded, index) => ({
          type: index === 0 ? ("cover" as const) : ("other" as const),
          imageUrl: uploaded.imageUrl,
          imagePublicId: uploaded.imagePublicId,
          sortOrder: index,
        })),
        moodScore: moodScore ?? undefined,
        feeling: handoffFeeling.trim() || undefined,
        capturedAt: cover.createdAt,
      });

      await removeDraftImages(images.map((img) => img.id));
      clearSession();
      await reloadDrafts();
      navigateAfterCreatePin(
        memory.id,
        memory.place.latitude,
        memory.place.longitude,
      );
      clearHandoff();
      return memory;
    } catch (error) {
      const apiError = toApiClientError(error);
      Alert.alert("Create pin", apiError.message);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return { submit, submitting };
}
