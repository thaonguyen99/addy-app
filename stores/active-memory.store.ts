import { create } from "zustand";

/**
 * The memory chat currently on screen, so a notification about it doesn't
 * pop a banner over the conversation it's about.
 */
export const useActiveMemoryStore = create<{ memoryId: string | null }>(
  () => ({ memoryId: null }),
);
