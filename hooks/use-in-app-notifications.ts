import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";

import { targetFromPushData } from "@/features/notifications/notification-target";
import { useActiveMemoryStore } from "@/stores/active-memory.store";
import { useInAppNotificationStore } from "@/stores/in-app-notification.store";

/**
 * A notification delivered while the app is open: the server only pushes when
 * no socket is connected (so this is mostly the brief gap while it
 * reconnects), plus the local On this day. Live socket rows get their banner
 * from the RealtimeProvider instead.
 */
export function useInAppNotifications(): void {
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body, data } = notification.request.content;
        const target = targetFromPushData(data);
        if (!title && !body) return;
        if (
          target?.memoryId &&
          target.memoryId === useActiveMemoryStore.getState().memoryId
        ) {
          return;
        }

        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        useInAppNotificationStore.getState().show({
          title: title ?? "Addy",
          body: body ?? undefined,
          target,
        });
      },
    );

    return () => sub.remove();
  }, []);
}
