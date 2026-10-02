import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

import type { QueuedPin } from "@/features/pin-queue/pin-queue-types";

const QUEUE_KEY_PREFIX = "addy.pinQueue.";
const PENDING_DIR = `${FileSystem.documentDirectory}pending/`;

function queueKey(userId: string) {
  return `${QUEUE_KEY_PREFIX}${userId}`;
}

export function pendingDirFor(clientId: string) {
  return `${PENDING_DIR}${clientId}/`;
}

export async function readQueue(userId: string): Promise<QueuedPin[]> {
  const raw = await AsyncStorage.getItem(queueKey(userId));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedPin[];
  } catch {
    return [];
  }
}

export async function writeQueue(userId: string, entries: readonly QueuedPin[]) {
  if (entries.length === 0) {
    await AsyncStorage.removeItem(queueKey(userId));
    return;
  }
  await AsyncStorage.setItem(queueKey(userId), JSON.stringify(entries));
}

/** Copies the (already re-encoded) draft photos into pending/{clientId}/. */
export async function copyPhotosToPending(
  clientId: string,
  sourceUris: readonly string[],
): Promise<string[]> {
  const dir = pendingDirFor(clientId);
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  const paths: string[] = [];
  for (const [index, from] of sourceUris.entries()) {
    const to = `${dir}${index}.jpg`;
    await FileSystem.copyAsync({ from, to });
    paths.push(to);
  }
  return paths;
}

export async function deletePendingFiles(clientId: string) {
  await FileSystem.deleteAsync(pendingDirFor(clientId), { idempotent: true });
}

/**
 * Removes pending/ folders no queue (of any user on this device) references —
 * left behind if the app died between copying photos and saving the entry.
 */
export async function sweepOrphanedPendingFiles() {
  const info = await FileSystem.getInfoAsync(PENDING_DIR);
  if (!info.exists) return;

  const keys = (await AsyncStorage.getAllKeys()).filter((k) =>
    k.startsWith(QUEUE_KEY_PREFIX),
  );
  const referenced = new Set<string>();
  for (const key of keys) {
    const entries = await readQueue(key.slice(QUEUE_KEY_PREFIX.length));
    for (const entry of entries) referenced.add(entry.clientId);
  }

  const dirs = await FileSystem.readDirectoryAsync(PENDING_DIR);
  await Promise.all(
    dirs
      .filter((clientId) => !referenced.has(clientId))
      .map((clientId) => deletePendingFiles(clientId)),
  );
}
