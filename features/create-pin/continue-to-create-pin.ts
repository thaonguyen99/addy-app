import { router } from "expo-router";

import type { CreatePinPayload } from "@/features/camera/create-pin-bridge";
import { useCreatePinHandoffStore } from "@/features/create-pin/store/create-pin-handoff-store";

/**
 * Saves the handoff payload and opens the review screen.
 * Does not call the API — upload/create runs on "Save memory" in CreatePinScreen.
 */
export function continueToCreatePinFlow(payload: CreatePinPayload) {
  useCreatePinHandoffStore.getState().setHandoff({
    images: payload.images,
    selectedPlace: payload.selectedPlace,
    moodScore: payload.moodScore ?? null,
    feeling: payload.feeling ?? "",
  });

  // Open review on the app stack. Do not dismiss camera modals first — on iOS that
  // drops the follow-up push; dismissAll() before push races on Android.
  router.push("/create-pin");
}
