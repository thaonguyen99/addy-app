import { create } from "zustand";

import type { MemoryDetail, MemoryImageType, MemoryVisibility } from "@/services/memories";
import type { PlaceSuggestion } from "@/services/places";
import type { PublicUser } from "@/services/users";

/** A photo in the edit draft: one already on the server, or one just picked. */
export type EditPhoto =
  | {
      kind: "remote";
      key: string;
      url: string;
      publicId: string;
      type: MemoryImageType;
    }
  | { kind: "local"; key: string; uri: string };

type EditMemoryState = {
  memoryId: string | null;
  photos: EditPhoto[];
  /** True once the user reordered, removed or added photos. */
  photosChanged: boolean;
  place: PlaceSuggestion | null;
  /** True once the user picked a different place. */
  placeChanged: boolean;
  moodScore: number | null;
  feeling: string;
  visibility: MemoryVisibility;
  taggedUsers: PublicUser[];
  /** Start a draft from the memory as it is on the server. */
  load: (memory: MemoryDetail) => void;
  setPhotos: (photos: EditPhoto[]) => void;
  setPlace: (place: PlaceSuggestion) => void;
  setMoodScore: (moodScore: number | null) => void;
  setFeeling: (feeling: string) => void;
  setVisibility: (visibility: MemoryVisibility) => void;
  setTaggedUsers: (users: PublicUser[]) => void;
  clear: () => void;
};

const EMPTY = {
  memoryId: null,
  photos: [],
  photosChanged: false,
  place: null,
  placeChanged: false,
  moodScore: null,
  feeling: "",
  visibility: "private" as MemoryVisibility,
  taggedUsers: [] as PublicUser[],
};

/** True when the draft tags a different set of people than the memory. */
export function taggedUsersChanged(
  draft: readonly PublicUser[],
  current: readonly PublicUser[],
): boolean {
  if (draft.length !== current.length) return true;
  const ids = new Set(current.map((user) => user.id));
  return draft.some((user) => !ids.has(user.id));
}

export const useEditMemoryStore = create<EditMemoryState>((set) => ({
  ...EMPTY,
  load: (memory) =>
    set({
      memoryId: memory.id,
      photos: [...memory.images]
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((image) => ({
          kind: "remote",
          key: image.publicId,
          url: image.url,
          publicId: image.publicId,
          type: image.type,
        })),
      photosChanged: false,
      place: {
        placeId: memory.place.externalPlaceId,
        name: memory.place.name,
        address: memory.place.formattedAddress,
        latitude: memory.place.latitude,
        longitude: memory.place.longitude,
      },
      placeChanged: false,
      moodScore: memory.moodScore,
      feeling: memory.feeling ?? "",
      visibility: memory.visibility,
      taggedUsers: memory.taggedUsers,
    }),
  setPhotos: (photos) => set({ photos, photosChanged: true }),
  setPlace: (place) => set({ place, placeChanged: true }),
  setMoodScore: (moodScore) => set({ moodScore }),
  setFeeling: (feeling) => set({ feeling }),
  setVisibility: (visibility) => set({ visibility }),
  setTaggedUsers: (taggedUsers) => set({ taggedUsers }),
  clear: () => set(EMPTY),
}));
