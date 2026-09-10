import { create } from "zustand";

import type { AddyMemoryImage } from "@/types/addy-memory";
import type { MemoryVisibility, PlaceSuggestion } from "@/types/api";

type CreatePinHandoffState = {
  images: readonly AddyMemoryImage[];
  moodScore: number | null;
  feeling: string;
  selectedPlace: PlaceSuggestion | null;
  visibility: MemoryVisibility;
  setHandoff: (handoff: {
    images: readonly AddyMemoryImage[];
    selectedPlace?: PlaceSuggestion | null;
    moodScore?: number | null;
    feeling?: string;
  }) => void;
  setVisibility: (visibility: MemoryVisibility) => void;
  clear: () => void;
};

export const useCreatePinHandoffStore = create<CreatePinHandoffState>((set) => ({
  images: [],
  moodScore: null,
  feeling: "",
  selectedPlace: null,
  visibility: "private",
  setHandoff: ({
    images,
    selectedPlace = null,
    moodScore = null,
    feeling = "",
  }) => set({ images, moodScore, feeling, selectedPlace }),
  setVisibility: (visibility) => set({ visibility }),
  clear: () =>
    set({
      images: [],
      moodScore: null,
      feeling: "",
      selectedPlace: null,
      visibility: "private",
    }),
}));
