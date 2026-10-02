import { create } from "zustand";

import {
  deletePendingFiles,
  readQueue,
  sweepOrphanedPendingFiles,
  writeQueue,
} from "@/features/pin-queue/pin-queue-storage";
import type { QueuedPin } from "@/features/pin-queue/pin-queue-types";

type PinQueueState = {
  /** Whose queue is loaded; null while signed out. */
  userId: string | null;
  hydrated: boolean;
  entries: QueuedPin[];
  /** Load `userId`'s queue (or unload with null). */
  hydrate: (userId: string | null) => Promise<void>;
  enqueue: (entry: QueuedPin) => Promise<void>;
  update: (clientId: string, patch: Partial<QueuedPin>) => Promise<void>;
  /** Drops the entry and its local photos. */
  remove: (clientId: string) => Promise<void>;
};

// Every persist goes through this chain so writes land in call order.
let writeChain: Promise<void> = Promise.resolve();

function persist(userId: string, entries: QueuedPin[]) {
  writeChain = writeChain
    .catch(() => {})
    .then(() => writeQueue(userId, entries));
  return writeChain;
}

/**
 * The signed-in user's offline pin queue: in memory for the UI, mirrored to
 * AsyncStorage (`addy.pinQueue.{userId}`) on every change.
 */
export const usePinQueueStore = create<PinQueueState>((set, get) => ({
  userId: null,
  hydrated: false,
  entries: [],

  hydrate: async (userId) => {
    if (!userId) {
      set({ userId: null, hydrated: false, entries: [] });
      return;
    }
    set({ userId, hydrated: false, entries: [] });
    await writeChain.catch(() => {});
    await sweepOrphanedPendingFiles().catch(() => {});
    // An entry left "uploading" means the app died mid-upload — safe to
    // resend: upload and create are both idempotent on clientId.
    const entries = (await readQueue(userId)).map((entry) =>
      entry.status === "uploading" ? { ...entry, status: "pending" as const } : entry,
    );
    if (get().userId !== userId) return; // switched accounts meanwhile
    set({ entries, hydrated: true });
  },

  enqueue: async (entry) => {
    const { userId, entries } = get();
    if (userId !== entry.userId) {
      throw new Error("Pin queue is not loaded for this account");
    }
    const next = [...entries, entry];
    set({ entries: next });
    await persist(entry.userId, next);
  },

  update: async (clientId, patch) => {
    const { userId, entries } = get();
    if (!userId) return;
    const next = entries.map((e) => (e.clientId === clientId ? { ...e, ...patch } : e));
    set({ entries: next });
    await persist(userId, next);
  },

  remove: async (clientId) => {
    const { userId, entries } = get();
    // Only ever touch the loaded user's own entries (and their files).
    if (!userId || !entries.some((e) => e.clientId === clientId)) return;
    const next = entries.filter((e) => e.clientId !== clientId);
    set({ entries: next });
    await persist(userId, next);
    await deletePendingFiles(clientId);
  },
}));

/** Account deletion: wipe this user's queue and every pending photo. */
export async function clearPinQueue(userId: string) {
  const entries = await readQueue(userId);
  await writeQueue(userId, []);
  await Promise.all(entries.map((e) => deletePendingFiles(e.clientId)));
  if (usePinQueueStore.getState().userId === userId) {
    usePinQueueStore.setState({ entries: [] });
  }
}
