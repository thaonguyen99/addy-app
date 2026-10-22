import { create } from "zustand";

import type { AddyMemoryImage } from "@/types/addy-memory";
import type { MemoryVisibility, PlaceSuggestion } from "@/types/api";

/** "auto" follows the device location; "picked" was chosen in the place picker. */
export type PlaceSource = "auto" | "picked";

/** Matches what new memories have always been created with. */
const DEFAULT_VISIBILITY: MemoryVisibility = "friends";

type CreatePinDraftState = {
  /** First image is the cover. */
  images: readonly AddyMemoryImage[];
  moodScore: number | null;
  feeling: string;
  selectedPlace: PlaceSuggestion | null;
  placeSource: PlaceSource;
  visibility: MemoryVisibility;
  /** Starts a fresh draft from the photo(s) just captured or picked. */
  startDraft: (images: readonly AddyMemoryImage[]) => void;
  addImages: (images: readonly AddyMemoryImage[]) => void;
  removeImage: (id: string) => void;
  /** Reorders by id; the first id becomes the cover. */
  reorderImages: (ids: readonly string[]) => void;
  setMoodScore: (score: number | null) => void;
  setFeeling: (feeling: string) => void;
  setPlace: (place: PlaceSuggestion | null, source: PlaceSource) => void;
  setVisibility: (visibility: MemoryVisibility) => void;
  clear: () => void;
};

const EMPTY = {
  images: [] as readonly AddyMemoryImage[],
  moodScore: null,
  feeling: "",
  selectedPlace: null,
  placeSource: "auto" as PlaceSource,
  visibility: DEFAULT_VISIBILITY,
};

/** The one-screen create flow's draft (create-pin + place-selection). */
export const useCreatePinHandoffStore = create<CreatePinDraftState>((set) => ({
  ...EMPTY,
  startDraft: (images) => set({ ...EMPTY, images }),
  addImages: (images) => set((s) => ({ images: [...s.images, ...images] })),
  removeImage: (id) =>
    set((s) => ({ images: s.images.filter((img) => img.id !== id) })),
  reorderImages: (ids) =>
    set((s) => {
      const byId = new Map(s.images.map((img) => [img.id, img]));
      const images = ids.flatMap((id) => byId.get(id) ?? []);
      return images.length === s.images.length ? { images } : s;
    }),
  setMoodScore: (moodScore) => set({ moodScore }),
  setFeeling: (feeling) => set({ feeling }),
  setPlace: (selectedPlace, placeSource) => set({ selectedPlace, placeSource }),
  setVisibility: (visibility) => set({ visibility }),
  clear: () => set(EMPTY),
}));
