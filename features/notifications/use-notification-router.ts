import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

/** Turn an addyapp:// notification URL into an in-app route. */
function toAppPath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const path = raw.replace(/^addyapp:\/\//, "/");
  if (path.startsWith("/memory/")) return path;
  if (path.startsWith("/friends")) return path.replace("/friends", "/(app)/friends");
  return null;
}

function handleResponse(response: Notifications.NotificationResponse) {
  const path = toAppPath(
    response.notification.request.content.data?.url,
  );
  if (path) {
    router.push(path as never);
  }
}

/**
 * Routes notification taps to the right screen — both while the app is running
 * and when a tap cold-starts it.
 */
export function useNotificationRouter(): void {
  useEffect(() => {
    let cancelled = false;

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!cancelled && response) handleResponse(response);
    });

    const sub =
      Notifications.addNotificationResponseReceivedListener(handleResponse);

    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);
}
