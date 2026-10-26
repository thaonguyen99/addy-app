import { create } from "zustand";

const BANNER_VISIBLE_MS = 4000;

export type InAppNotification = {
  title: string;
  body: string;
  /** In-app route to open on tap; null when the push has nowhere to go. */
  path: string | null;
};

type InAppNotificationState = {
  notification: InAppNotification | null;
  visible: boolean;
  show: (notification: InAppNotification) => void;
  hide: () => void;
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;

/** The push that arrived while the app was open. Rendered by `InAppNotificationBanner`. */
export const useInAppNotificationStore = create<InAppNotificationState>(
  (set) => ({
    notification: null,
    visible: false,
    show: (notification) => {
      if (hideTimer) clearTimeout(hideTimer);
      set({ notification, visible: true });
      hideTimer = setTimeout(() => set({ visible: false }), BANNER_VISIBLE_MS);
    },
    hide: () => {
      if (hideTimer) clearTimeout(hideTimer);
      set({ visible: false });
    },
  }),
);
