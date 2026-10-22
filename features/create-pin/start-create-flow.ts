import { router } from "expo-router";

import { useCreatePinHandoffStore } from "@/features/create-pin/store/create-pin-handoff-store";
import type { AddyMemoryImage } from "@/types/addy-memory";

/**
 * Opens the one-screen create flow with a fresh draft. Nothing uploads here —
 * "Pin it" queues the memory (see useCreatePinSubmit).
 */
export function startCreateFlow(images: readonly AddyMemoryImage[]) {
  if (images.length === 0) return;
  useCreatePinHandoffStore.getState().startDraft(images);
  router.push("/create-pin");
}
