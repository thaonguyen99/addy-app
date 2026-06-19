import { create } from "zustand";

import type { AddyMemoryImage } from "@/types/addy-memory";
import type { PlaceSuggestion } from "@/types/api";

type CreatePinHandoffState = {
  images: readonly AddyMemoryImage[];
  moodScore: number | null;
  feeling: string;
  selectedPlace: PlaceSuggestion | null;
  setHandoff: (handoff: {
    images: readonly AddyMemoryImage[];
    selectedPlace?: PlaceSuggestion | null;
    moodScore?: number | null;
    feeling?: string;
  }) => void;
  clear: () => void;
};

export const useCreatePinHandoffStore = create<CreatePinHandoffState>((set) => ({
  images: [],
  moodScore: null,
  feeling: "",
  selectedPlace: null,
  setHandoff: ({
    images,
    selectedPlace = null,
    moodScore = null,
    feeling = "",
  }) => set({ images, moodScore, feeling, selectedPlace }),
  clear: () =>
    set({ images: [], moodScore: null, feeling: "", selectedPlace: null }),
}));
