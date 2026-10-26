import { create } from "zustand";

const TOAST_VISIBLE_MS = 3000;

type ToastState = {
  message: string | null;
  visible: boolean;
  show: (message: string) => void;
  hide: () => void;
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;

/** App-wide transient toast (e.g. "thanks for reporting"). Rendered by `AppToastHost`. */
export const useToastStore = create<ToastState>((set) => ({
  message: null,
  visible: false,
  show: (message) => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ message, visible: true });
    hideTimer = setTimeout(() => set({ visible: false }), TOAST_VISIBLE_MS);
  },
  hide: () => {
    if (hideTimer) clearTimeout(hideTimer);
    set({ visible: false });
  },
}));

export function showToast(message: string) {
  useToastStore.getState().show(message);
}
