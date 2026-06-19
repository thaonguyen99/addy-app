import { create } from "zustand";

type MapFocusCoords = {
  latitude: number;
  longitude: number;
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
