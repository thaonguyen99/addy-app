import * as Notifications from "expo-notifications";
import { useEffect } from "react";

import {
  openNotificationTarget,
  targetFromPushData,
} from "@/features/notifications/notification-target";

/** Taps already routed, so a cold-start response isn't replayed on remount. */
const handled = new Set<string>();

function handleResponse(response: Notifications.NotificationResponse) {
  const id = response.notification.request.identifier;
  if (handled.has(id)) return;
  handled.add(id);
  const target = targetFromPushData(response.notification.request.content.data);
  if (target) void openNotificationTarget(target);
}

/**
 * Routes notification taps (server pushes and the local On this day) to the
 * right screen: from a cold start, from the background, and while open.
 * Mounted inside the signed-in stack so the navigator and session exist.
 */
export function useNotificationRouter(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (cancelled || !response) return;
      handleResponse(response);
      // Otherwise the same tap is replayed on the next launch.
      void Notifications.clearLastNotificationResponseAsync();
    });

    const sub =
      Notifications.addNotificationResponseReceivedListener(handleResponse);

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, [enabled]);
}
