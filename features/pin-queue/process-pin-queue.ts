import NetInfo from "@react-native-community/netinfo";
import * as FileSystem from "expo-file-system/legacy";

import { useAuthStore } from "@/features/auth/store/auth-store";
import { usePinQueueStore } from "@/features/pin-queue/pin-queue-store";
import type { QueuedPin } from "@/features/pin-queue/pin-queue-types";
import { ApiClientError, toApiClientError } from "@/lib/api/errors";
import { uploadImages } from "@/lib/api/media";
import { createMemory } from "@/lib/api/memories";
import { reverseGeocode } from "@/lib/api/places";
import { queryClient } from "@/lib/query/client";
import { queryKeys } from "@/lib/query/keys";
import type { PlaceInput } from "@/types/api";

const BACKOFF_BASE_MS = 5_000;
const BACKOFF_MAX_MS = 10 * 60_000;

/** Thrown when the account changed mid-run — stop without touching the entry. */
class AccountChangedError extends Error {}

let running: Promise<void> | null = null;
let rerunRequested = false;
let rerunIgnoresBackoff = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

/** clientId → server memory id, for callers that need the created memory. */
const uploadedMemoryIds = new Map<string, string>();

export function getUploadedMemoryId(clientId: string) {
  return uploadedMemoryIds.get(clientId);
}

/**
 * Uploads queued pins one at a time. Only one run is ever active: calling
 * while a run is in flight returns that run and schedules one more pass after
 * it (so an entry queued mid-run is never stranded).
 *
 * `ignoreBackoff` — used for "things just changed" triggers (app start,
 * reconnect, foreground, manual retry) so pending entries go right away
 * instead of waiting out their backoff.
 */
export function processPinQueue(options?: { ignoreBackoff?: boolean }): Promise<void> {
  const ignoreBackoff = options?.ignoreBackoff ?? false;
  if (running) {
    rerunRequested = true;
    rerunIgnoresBackoff ||= ignoreBackoff;
    return running;
  }
  running = runQueue(ignoreBackoff).finally(() => {
    running = null;
    if (rerunRequested) {
      const nextIgnoresBackoff = rerunIgnoresBackoff;
      rerunRequested = false;
      rerunIgnoresBackoff = false;
      void processPinQueue({ ignoreBackoff: nextIgnoresBackoff });
    }
  });
  return running;
}

function currentUserId() {
  return useAuthStore.getState().user?.id ?? null;
}

function assertOwner(entry: QueuedPin) {
  if (
    currentUserId() !== entry.userId ||
    usePinQueueStore.getState().userId !== entry.userId
  ) {
    throw new AccountChangedError();
  }
}

function isPermanentFailure(error: ApiClientError) {
  const status = error.status;
  if (status === undefined || status < 400 || status >= 500) return false;
  // 401 = session trouble (the client already tried a refresh), not a bad
  // draft; 408/429 are explicitly retryable.
  return status !== 401 && status !== 408 && status !== 429;
}

function backoffDelay(attempts: number) {
  return Math.min(BACKOFF_BASE_MS * 2 ** (attempts - 1), BACKOFF_MAX_MS);
}

async function runQueue(ignoreBackoff: boolean) {
  const userId = currentUserId();
  const store = usePinQueueStore.getState();
  if (!userId || store.userId !== userId || !store.hydrated) return;

  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  const attemptedThisRun = new Set<string>();

  while (true) {
    const net = await NetInfo.fetch();
    if (net.isConnected === false) break; // don't burn attempts while offline

    const now = Date.now();
    const next = usePinQueueStore
      .getState()
      .entries.find(
        (e) =>
          e.userId === userId &&
          e.status === "pending" &&
          !attemptedThisRun.has(e.clientId) &&
          (ignoreBackoff || e.nextAttemptAt <= now),
      );
    if (!next) break;
    attemptedThisRun.add(next.clientId);

    const outcome = await uploadEntry(next);
    if (outcome === "stop") break;
  }

  scheduleNextRetry(userId);
}

async function uploadEntry(entry: QueuedPin): Promise<"ok" | "stop"> {
  const { update, remove } = usePinQueueStore.getState();
  try {
    assertOwner(entry);
    if (!(await photosExist(entry))) {
      // Retrying can never fix this — surface it for the user to delete.
      await update(entry.clientId, {
        status: "failed",
        lastError: "The photos for this draft are missing.",
      });
      return "ok";
    }
    await update(entry.clientId, { status: "uploading" });

    const place = await resolvePlace(entry);
    assertOwner(entry);
    const uploaded = await uploadImages(entry.photoPaths, {
      clientId: entry.clientId,
      index: 0,
    });

    assertOwner(entry);
    const memory = await createMemory({
      clientId: entry.clientId,
      place,
      images: uploaded.map((image, index) => ({
        type: index === 0 ? ("cover" as const) : ("other" as const),
        imageUrl: image.imageUrl,
        imagePublicId: image.imagePublicId,
        sortOrder: index,
      })),
      moodScore: entry.moodScore ?? undefined,
      feeling: entry.feeling ?? undefined,
      capturedAt: entry.capturedAt,
      visibility: entry.visibility,
    });

    uploadedMemoryIds.set(entry.clientId, memory.id);
    await remove(entry.clientId);
    queryClient.invalidateQueries({ queryKey: ["memories", "map"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.memoriesFeed });
    queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    return "ok";
  } catch (rawError) {
    if (rawError instanceof AccountChangedError) return "stop";

    const error = toApiClientError(rawError);
    if (isPermanentFailure(error)) {
      await update(entry.clientId, { status: "failed", lastError: error.message });
      return "ok"; // this draft is rejected; others may still go through
    }

    // Transient (offline, timeout, 5xx, 408, 429, 401): back off and stop
    // this run — the next entry would almost certainly fail the same way.
    const attempts = entry.attempts + 1;
    await update(entry.clientId, {
      status: "pending",
      attempts,
      nextAttemptAt: Date.now() + backoffDelay(attempts),
      lastError: error.message,
    });
    return "stop";
  }
}

async function photosExist(entry: QueuedPin) {
  const infos = await Promise.all(
    entry.photoPaths.map((path) => FileSystem.getInfoAsync(path)),
  );
  return infos.length > 0 && infos.every((info) => info.exists);
}

/**
 * Offline pins only have coordinates: turn them into a real place now. If the
 * geocoder has nothing for this spot (4xx), keep the pin as an unnamed place
 * at those coordinates rather than failing it.
 */
async function resolvePlace(entry: QueuedPin): Promise<PlaceInput> {
  if (entry.place.kind === "resolved") return entry.place.input;

  const { latitude, longitude, name } = entry.place;
  try {
    const result = await reverseGeocode(latitude, longitude);
    return {
      externalPlaceId: result.externalPlaceId,
      name: name ?? result.name,
      formattedAddress: result.formattedAddress,
      latitude: result.latitude,
      longitude: result.longitude,
      types: result.types,
    };
  } catch (rawError) {
    const error = toApiClientError(rawError);
    if (!isPermanentFailure(error)) throw error;
    return {
      externalPlaceId: `coords:${latitude.toFixed(5)},${longitude.toFixed(5)}`,
      name: name ?? "Unnamed place",
      formattedAddress: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
      latitude,
      longitude,
      types: [],
    };
  }
}

function scheduleNextRetry(userId: string) {
  const waiting = usePinQueueStore
    .getState()
    .entries.filter((e) => e.userId === userId && e.status === "pending");
  if (waiting.length === 0) return;

  const soonest = Math.min(...waiting.map((e) => e.nextAttemptAt));
  const delay = Math.max(soonest - Date.now(), 1_000);
  retryTimer = setTimeout(() => {
    retryTimer = null;
    void processPinQueue();
  }, delay);
}

/** Manual "tap to retry" on a failed draft. */
export async function retryQueuedPin(clientId: string) {
  await usePinQueueStore.getState().update(clientId, {
    status: "pending",
    attempts: 0,
    nextAttemptAt: 0,
    lastError: undefined,
  });
  await processPinQueue({ ignoreBackoff: true });
}
