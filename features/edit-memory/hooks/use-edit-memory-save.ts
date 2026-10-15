import { useState } from "react";
import { Alert } from "react-native";

import { useEditMemoryStore } from "@/features/edit-memory/store/edit-memory-store";
import { isUnresolvedPlace } from "@/features/location/fallback-places";
import { placeSuggestionToPlaceInput } from "@/features/location/place-input";
import { checkImagesSafety } from "@/features/moderation/check-image-safety";
import { getApiErrorMessage } from "@/lib/api/errors";
import { uploadImages } from "@/lib/api/media";
import { useUpdateMemoryMutation } from "@/lib/query/hooks";
import type {
  CreateMemoryImageInput,
  MemoryDetail,
  PlaceInput,
  PlaceSuggestion,
  UpdateMemoryInput,
} from "@/types/api";

/** A GPS-only place (geocoder had nothing) is saved as an unnamed spot at those coordinates. */
function toPlaceInput(place: PlaceSuggestion): PlaceInput {
  if (!isUnresolvedPlace(place)) return placeSuggestionToPlaceInput(place);
  const { latitude, longitude } = place;
  return {
    externalPlaceId: `coords:${latitude.toFixed(5)},${longitude.toFixed(5)}`,
    name: "Unnamed place",
    formattedAddress: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    latitude,
    longitude,
    types: [],
  };
}

/**
 * Saves the edit draft: checks and uploads newly added photos, then sends one
 * PATCH with only the fields that changed. Unlike creating a pin this needs a
 * connection — the memory already exists on the server.
 */
export function useEditMemorySave(memory: MemoryDetail | undefined) {
  const [saving, setSaving] = useState(false);
  const updateMemory = useUpdateMemoryMutation(memory?.id ?? "");

  const save = async (): Promise<boolean> => {
    if (!memory) return false;
    const draft = useEditMemoryStore.getState();
    if (draft.photos.length === 0) {
      Alert.alert("Edit memory", "Keep at least one photo.");
      return false;
    }

    setSaving(true);
    try {
      const input: UpdateMemoryInput = {};

      if (draft.photosChanged) {
        const localUris = draft.photos.flatMap((photo) =>
          photo.kind === "local" ? [photo.uri] : [],
        );
        const safety = await checkImagesSafety(localUris);
        if (safety.some((result) => !result.safe)) {
          Alert.alert(
            "Edit memory",
            "One of the new photos looks like it may violate our content guidelines. Remove it and try again.",
          );
          return false;
        }

        const uploaded = localUris.length > 0 ? await uploadImages(localUris) : [];
        let next = 0;
        input.images = draft.photos.map((photo, index): CreateMemoryImageInput => {
          const type =
            index === 0 ? "cover" : photo.kind === "remote" && photo.type !== "cover" ? photo.type : "other";
          if (photo.kind === "remote") {
            return { type, imageUrl: photo.url, imagePublicId: photo.publicId, sortOrder: index };
          }
          const result = uploaded[next++];
          return {
            type,
            imageUrl: result.imageUrl,
            imagePublicId: result.imagePublicId,
            sortOrder: index,
          };
        });
      }

      if (draft.placeChanged && draft.place) {
        input.place = toPlaceInput(draft.place);
      }

      const feeling = draft.feeling.trim();
      if (feeling !== (memory.feeling ?? "")) {
        input.feeling = feeling || null;
      }
      if (draft.moodScore !== memory.moodScore) {
        input.moodScore = draft.moodScore;
      }
      if (draft.visibility !== memory.visibility) {
        input.visibility = draft.visibility;
      }

      if (Object.keys(input).length > 0) {
        await updateMemory.mutateAsync(input);
      }
      return true;
    } catch (error) {
      Alert.alert(
        "Edit memory",
        getApiErrorMessage(error, "Couldn't save your changes. Please try again."),
      );
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { save, saving };
}
