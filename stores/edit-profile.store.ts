import { create } from "zustand";

type EditProfileState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

/** Whether the Edit profile sheet is showing. `EditProfileSheet` renders it. */
export const useEditProfileStore = create<EditProfileState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

/** Open Edit profile from the You tab, Settings › Account, or "Add a bio". */
export function openEditProfile(): void {
  useEditProfileStore.getState().setOpen(true);
}
