import { Alert } from "react-native";

import { usePinQueueStore } from "@/features/pin-queue/pin-queue-store";
import type { QueuedPin } from "@/features/pin-queue/pin-queue-types";
import {
  processPinQueue,
  retryQueuedPin,
} from "@/features/pin-queue/process-pin-queue";

function confirmDeleteDraft(pin: QueuedPin) {
  Alert.alert(
    "Delete this draft?",
    "It never made it to the server, so its photos will be gone for good.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete draft",
        style: "destructive",
        onPress: () => void usePinQueueStore.getState().remove(pin.clientId),
      },
    ],
  );
}

/** Tap handler for a queued pin on Home or the map. */
export function showQueuedPinActions(pin: QueuedPin) {
  if (pin.status === "failed") {
    Alert.alert(
      "Couldn't upload",
      pin.lastError || "The server didn't accept this memory.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete draft",
          style: "destructive",
          onPress: () => confirmDeleteDraft(pin),
        },
        { text: "Retry", onPress: () => void retryQueuedPin(pin.clientId) },
      ],
    );
    return;
  }

  Alert.alert(
    "Waiting to upload",
    "This memory is saved on your phone and uploads by itself as soon as you're online.",
    [
      { text: "OK", style: "cancel" },
      {
        text: "Try now",
        onPress: () => void processPinQueue({ ignoreBackoff: true }),
      },
    ],
  );
}
