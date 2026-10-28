import { create } from "zustand";

/** A friend shared a memory since the map last loaded (`feed:stale`). */
export const useFeedStaleStore = create<{
  mapStale: boolean;
  setMapStale: (stale: boolean) => void;
}>((set) => ({
  mapStale: false,
  setMapStale: (mapStale) => set({ mapStale }),
}));
