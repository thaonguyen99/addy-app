import { create } from "zustand";

type MapFocusCoords = {
  latitude: number;
  longitude: number;
  /** A friend's memory: turn the friends layer on so its pin shows. */
  withFriends?: boolean;
};

type MapFocusState = {
  pendingFocus: MapFocusCoords | null;
  showSuccessToast: boolean;
  setPendingFocus: (coords: MapFocusCoords | null) => void;
  setShowSuccessToast: (show: boolean) => void;
};

export const useMapFocusStore = create<MapFocusState>((set) => ({
  pendingFocus: null,
  showSuccessToast: false,
  setPendingFocus: (coords) => set({ pendingFocus: coords }),
  setShowSuccessToast: (show) => set({ showSuccessToast: show }),
}));
