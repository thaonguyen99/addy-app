import { create } from "zustand";

import type { PublicUser } from "@/services/users";

export type QrSide = "code" | "scan";

/** Who the Add sheet is about: an invite token (link or QR) adds instantly. */
export type AddTarget = { kind: "token"; token: string };

/** The new friend to celebrate; push-driven ones only know the id. */
export type CelebrateTarget = { userId: string; user?: PublicUser };

/** A friend for the long-press / ⋯ menu. */
export type FriendMenuTarget = { user: PublicUser; friendsSince?: string };

type FriendSheetsState = {
  /** Which side the QR sheet is open on; null when closed. */
  qr: QrSide | null;
  add: AddTarget | null;
  celebrate: CelebrateTarget | null;
  menu: FriendMenuTarget | null;
  /** The Friends tab (with the invite card) is on screen. */
  friendsTabFocused: boolean;
  setFriendsTabFocused: (focused: boolean) => void;
  openQr: (side?: QrSide) => void;
  closeQr: () => void;
  openAdd: (target: AddTarget) => void;
  closeAdd: () => void;
  openCelebrate: (target: CelebrateTarget) => void;
  closeCelebrate: () => void;
  openFriendMenu: (target: FriendMenuTarget) => void;
  closeFriendMenu: () => void;
};

/** Friend sheets that can be opened from anywhere; `FriendSheetsHost` renders them. */
export const useFriendSheetsStore = create<FriendSheetsState>((set) => ({
  qr: null,
  add: null,
  celebrate: null,
  menu: null,
  friendsTabFocused: false,
  setFriendsTabFocused: (friendsTabFocused) => set({ friendsTabFocused }),
  openQr: (side = "code") => set({ qr: side }),
  closeQr: () => set({ qr: null }),
  openAdd: (add) => set({ add }),
  closeAdd: () => set({ add: null }),
  openCelebrate: (celebrate) => set({ celebrate }),
  closeCelebrate: () => set({ celebrate: null }),
  openFriendMenu: (menu) => set({ menu }),
  closeFriendMenu: () => set({ menu: null }),
}));

/** Show "You're friends" for someone you just added or accepted. */
export function celebrateFriend(user: PublicUser): void {
  useFriendSheetsStore.getState().openCelebrate({ userId: user.id, user });
}

/** Open the Add sheet for an invite token (link or QR). */
export function openInvite(token: string): void {
  useFriendSheetsStore.getState().openAdd({ kind: "token", token });
}
