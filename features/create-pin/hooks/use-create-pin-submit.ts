import * as Crypto from "expo-crypto";
import { useState } from "react";
import { Alert } from "react-native";

import { useAuthStore } from "@/features/auth/store/auth-store";
import { useCameraSession } from "@/features/camera/context/camera-session-context";
import { navigateAfterCreatePin } from "@/features/create-pin/navigate-after-create-pin";
import { useCreatePinHandoffStore } from "@/features/create-pin/store/create-pin-handoff-store";
import { removeDraftImages } from "@/features/drafts/draft-image-storage";
import {
  isUnresolvedPlace,
  UNRESOLVED_PLACE_NAME,
} from "@/features/location/fallback-places";
import { placeSuggestionToPlaceInput } from "@/features/location/place-input";
import { checkImagesSafety } from "@/features/moderation/check-image-safety";
import { handleOnboardingPinSaved } from "@/features/onboarding/navigate-after-onboarding-pin";
import { useOnboardingCaptureStore } from "@/features/onboarding/store/onboarding-capture-store";
import { copyPhotosToPending } from "@/features/pin-queue/pin-queue-storage";
import { usePinQueueStore } from "@/features/pin-queue/pin-queue-store";
import {
  queuedPinCoordinates,
  type QueuedPin,
  type QueuedPinPlace,
} from "@/features/pin-queue/pin-queue-types";
import {
  getUploadedMemoryId,
  processPinQueue,
} from "@/features/pin-queue/process-pin-queue";
import type { AddyMemoryImage } from "@/types/addy-memory";
import type { PlaceSuggestion } from "@/types/api";

function toQueuedPlace(place: PlaceSuggestion): QueuedPinPlace {
  if (isUnresolvedPlace(place)) {
    const name = place.name.trim();
    return {
      kind: "coords",
      latitude: place.latitude,
      longitude: place.longitude,
      name: name && name !== UNRESOLVED_PLACE_NAME ? name : null,
    };
  }
  return { kind: "resolved", input: placeSuggestionToPlaceInput(place) };
}

/**
 * Saving a pin never waits on the network: the photos are copied into the
 * offline queue and the flow finishes immediately. The queue processor
 * uploads it (now, or whenever the connection comes back).
 */
export function useCreatePinSubmit(images: readonly AddyMemoryImage[]) {
  const [submitting, setSubmitting] = useState(false);
  const clearHandoff = useCreatePinHandoffStore((s) => s.clear);
  const moodScore = useCreatePinHandoffStore((s) => s.moodScore);
  const handoffFeeling = useCreatePinHandoffStore((s) => s.feeling);
  const selectedPlace = useCreatePinHandoffStore((s) => s.selectedPlace);
  const visibility = useCreatePinHandoffStore((s) => s.visibility);
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

    const userId = useAuthStore.getState().user?.id;
    if (!userId) return null;

    setSubmitting(true);

    try {
      // On-device check — works offline.
      const safetyResults = await checkImagesSafety(
        images.map((image) => image.uri),
      );
      if (safetyResults.some((result) => !result.safe)) {
        Alert.alert(
          "Create pin",
          "One of these photos looks like it may violate our content guidelines. Remove it and try again.",
        );
        return null;
      }

      const queue = usePinQueueStore.getState();
      if (!queue.hydrated || queue.userId !== userId) {
        await queue.hydrate(userId);
      }

      const clientId = Crypto.randomUUID();
      const photoPaths = await copyPhotosToPending(
        clientId,
        images.map((image) => image.uri),
      );
      const now = new Date().toISOString();
      const entry: QueuedPin = {
        clientId,
        userId,
        photoPaths,
        place: toQueuedPlace(selectedPlace),
        feeling: handoffFeeling.trim() || null,
        moodScore,
        visibility,
        capturedAt: images[0].createdAt,
        createdAt: now,
        attempts: 0,
        nextAttemptAt: 0,
        status: "pending",
      };
      await usePinQueueStore.getState().enqueue(entry);

      // The queue owns its own copies now — the drafts can go.
      await removeDraftImages(images.map((img) => img.id));
      clearSession();
      await reloadDrafts();

      const coords = queuedPinCoordinates(entry);
      if (useOnboardingCaptureStore.getState().active) {
        // The tour opens the created memory next, so give the upload a
        // chance first; offline it just continues without one.
        await processPinQueue({ ignoreBackoff: true });
        handleOnboardingPinSaved(getUploadedMemoryId(clientId) ?? null, coords);
      } else {
        navigateAfterCreatePin(coords.latitude, coords.longitude);
        void processPinQueue({ ignoreBackoff: true });
      }
      clearHandoff();
      return entry;
    } catch (error) {
      console.warn("[create-pin] could not queue pin", error);
      Alert.alert(
        "Create pin",
        "Couldn't save this memory on your phone. Please try again.",
      );
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return { submit, submitting };
}
