import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { usePathname } from "expo-router";
import { useEffect, useRef } from "react";

import { useInAppNotificationStore } from "@/features/notifications/in-app-notification-store";
import { toAppPath } from "@/features/notifications/use-notification-router";
import { queryKeys } from "@/lib/query/keys";

function memoryIdFromPath(path: string | null): string | null {
  return path?.match(/^\/memory\/([^/?]+)/)?.[1] ?? null;
}

/**
 * Handles pushes that arrive while the app is open: refreshes the data they
 * touch so open screens update live, then shows the in-app banner — unless the
 * user is already looking at that memory's thread.
 */
export function useInAppNotifications(): void {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  // The listener is registered once; read the current screen through a ref.
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;
      const path = toAppPath(data?.url);
      const memoryId = memoryIdFromPath(path);

      switch (data?.type) {
        case "friend_request_received":
          queryClient.invalidateQueries({ queryKey: ["friends", "requests"] });
          break;
        case "friend_request_accepted":
          queryClient.invalidateQueries({ queryKey: queryKeys.friends });
          queryClient.invalidateQueries({ queryKey: ["friends", "requests"] });
          queryClient.invalidateQueries({ queryKey: ["memories", "friends-map"] });
          break;
        case "reaction_received":
        case "message_received":
        case "message_liked":
        case "message_mentioned":
          if (memoryId) {
            queryClient.invalidateQueries({ queryKey: queryKeys.memory(memoryId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.memoryReactions(memoryId) });
            queryClient.invalidateQueries({ queryKey: queryKeys.memoryMessages(memoryId) });
          }
          break;
      }

      if (memoryId && pathnameRef.current === `/memory/${memoryId}`) return;
      if (!title && !body) return;

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      useInAppNotificationStore.getState().show({
        title: title ?? "Addy",
        body: body ?? "",
        path,
      });
    });

    return () => sub.remove();
  }, [queryClient]);
}
