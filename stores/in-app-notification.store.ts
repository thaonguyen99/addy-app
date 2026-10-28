import { create } from "zustand";

import type { NotificationTarget } from "@/features/notifications/notification-target";

const BANNER_VISIBLE_MS = 4000;

export type InAppNotification = {
  title: string;
  body?: string;
  /** Bolded at the start of `title` when it begins with it. */
  lead?: string;
  actor?: { username: string; avatarUrl: string | null } | null;
  thumbUrl?: string;
  /** Where a tap goes; null when there's nowhere to go. */
  target: NotificationTarget | null;
};

type InAppNotificationState = {
  notification: InAppNotification | null;
  visible: boolean;
  show: (notification: InAppNotification) => void;
  hide: () => void;
};

let hideTimer: ReturnType<typeof setTimeout> | null = null;

/** A notification that arrived while the app was open. Rendered by `InAppNotificationBanner`. */
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
