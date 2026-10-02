import type { MemoryVisibility, PlaceInput } from "@/types/api";

/**
 * Where a queued pin is. `coords` = the user pinned offline with only a GPS
 * fix; the processor reverse-geocodes it into a real place right before
 * creating the memory. `name` is a venue name the user typed, if any.
 */
export type QueuedPinPlace =
  | { kind: "resolved"; input: PlaceInput }
  | { kind: "coords"; latitude: number; longitude: number; name: string | null };

export type QueuedPinStatus = "pending" | "uploading" | "failed";

export type QueuedPin = {
  /** UUID v4, sent as clientId on upload + create so retries never duplicate. */
  clientId: string;
  /** Owner — a queue entry is never uploaded under any other account. */
  userId: string;
  /** Local copies under documentDirectory/pending/{clientId}/, cover first. */
  photoPaths: string[];
  place: QueuedPinPlace;
  feeling: string | null;
  moodScore: number | null;
  visibility: MemoryVisibility;
  capturedAt: string;
  createdAt: string;
  attempts: number;
  /** Epoch ms before which automatic retries skip this entry. */
  nextAttemptAt: number;
  status: QueuedPinStatus;
  lastError?: string;
};

export function queuedPinCoordinates(pin: QueuedPin) {
  return pin.place.kind === "resolved"
    ? { latitude: pin.place.input.latitude, longitude: pin.place.input.longitude }
    : { latitude: pin.place.latitude, longitude: pin.place.longitude };
}

export function queuedPinPlaceName(pin: QueuedPin) {
  return pin.place.kind === "resolved"
    ? pin.place.input.name
    : (pin.place.name ?? "Unnamed place");
}
