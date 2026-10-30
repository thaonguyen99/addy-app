import { create } from "zustand";

export type PickedPhoto = {
  /** Square JPEG, cropped as framed in the picker. */
  uri: string;
  /** When the photo was taken, if the library knows. */
  takenAt: string | null;
};

type PhotoPickerRequest = {
  /** Most photos the user can select at once. */
  limit: number;
  resolve: (photos: PickedPhoto[]) => void;
};

type PhotoPickerState = {
  request: PhotoPickerRequest | null;
  open: (request: PhotoPickerRequest) => void;
  /** Answers the open request (empty = cancelled); later calls are no-ops. */
  settle: (photos: PickedPhoto[]) => void;
};

/** Hands the picker screen's result back to whoever opened it. */
export const usePhotoPickerStore = create<PhotoPickerState>((set, get) => ({
  request: null,
  open: (request) => {
    get().settle([]);
    set({ request });
  },
  settle: (photos) => {
    const { request } = get();
    if (!request) return;
    set({ request: null });
    request.resolve(photos);
  },
}));
