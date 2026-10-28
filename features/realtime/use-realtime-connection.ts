import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { AppState } from "react-native";

import { celebrateFriendOnce } from "@/features/friends/celebrated-friends";
import { bannerFromRow } from "@/features/notifications/notification-text";
import { invalidateFocusedQueries } from "@/hooks/use-focused-query-keys";
import { RefreshRejectedError, refreshSession } from "@/services/api/client";
import { invalidateSocialLists } from "@/services/friends";
import {
  removeNotifications,
  setNotificationCounts,
  upsertNotification,
} from "@/services/notifications";
import { queryKeys } from "@/services/query/keys";
import { realtime } from "@/services/realtime/socket";
import { useActiveMemoryStore } from "@/stores/active-memory.store";
import { useAuthStore } from "@/stores/auth.store";
import { useFeedStaleStore } from "@/stores/feed-stale.store";
import { useFriendSheetsStore } from "@/stores/friend-sheets.store";
import { useInAppNotificationStore } from "@/stores/in-app-notification.store";

/** Fresh-token reconnects in a row before waiting for the next foreground. */
const MAX_AUTH_RETRIES = 2;

/**
 * Owns the app's one socket: connected while signed in and in the
 * foreground, reconnected with a fresh token when the server rejects or drops
 * an expired one. Handles the user-wide events (🔔, friends, feed).
 */
export function useRealtimeConnection(): void {
  const queryClient = useQueryClient();
  const status = useAuthStore((s) => s.status);
  const authenticated = status === "authenticated";

  // Connection lifecycle.
  useEffect(() => {
    if (!authenticated) return;

    let authRetries = 0;
    let everConnected = false;

    const connectNow = () => {
      const token = useAuthStore.getState().accessToken;
      if (token) realtime.connect(token);
    };

    const reconnectWithFreshToken = () => {
      if (authRetries >= MAX_AUTH_RETRIES) return;
      authRetries += 1;
      refreshSession()
        .then((tokens) => {
          if (AppState.currentState === "active") {
            realtime.connect(tokens.accessToken);
          }
        })
        .catch((error) => {
          if (error instanceof RefreshRejectedError) {
            void useAuthStore.getState().signOut();
          }
        });
    };

    realtime.setLifecycle({
      connect: () => {
        authRetries = 0;
        // A reconnect may have missed events: refresh what's on screen.
        if (everConnected) {
          void queryClient.invalidateQueries({ queryKey: ["notifications"] });
          invalidateFocusedQueries(queryClient);
          // The friends map is mounted (it's a tab), so that refetches it.
          void queryClient.invalidateQueries({ queryKey: ["memories", "friends-map"] });
          useFeedStaleStore.getState().setMapStale(false);
        }
        everConnected = true;
      },
      connectError: (error) => {
        if (error.message === "UNAUTHORIZED") reconnectWithFreshToken();
      },
      disconnect: (reason) => {
        // The server drops the socket when the token expires; anything else
        // reconnects on its own.
        if (reason === "io server disconnect") reconnectWithFreshToken();
      },
    });
    connectNow();

    // Tokens rotated by the API client apply on the next reconnect.
    const unsubscribeToken = useAuthStore.subscribe((state, prev) => {
      if (state.accessToken && state.accessToken !== prev.accessToken) {
        realtime.setToken(state.accessToken);
      }
    });

    // Pushes only go out while no socket is connected, so drop it in the
    // background and come back on foreground.
    const appStateSub = AppState.addEventListener("change", (next) => {
      if (next === "background") {
        realtime.disconnect();
      } else if (next === "active" && !realtime.connected) {
        authRetries = 0;
        connectNow();
      }
    });

    return () => {
      unsubscribeToken();
      appStateSub.remove();
      realtime.setLifecycle(null);
      realtime.reset();
    };
  }, [authenticated, queryClient]);

  // User-wide events.
  useEffect(() => {
    if (!authenticated) return;

    const offs = [
      realtime.on("notification:upsert", (row) => {
        upsertNotification(queryClient, row);
        if (row.type === "FRIEND_REQUEST") {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.friendRequests("incoming"),
          });
        }
        const activeMemoryId = useActiveMemoryStore.getState().memoryId;
        if (row.data.memoryId && row.data.memoryId === activeMemoryId) return;
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        useInAppNotificationStore.getState().show(bannerFromRow(row));
      }),
      realtime.on("notification:removed", ({ ids }) => {
        removeNotifications(queryClient, ids);
      }),
      realtime.on("notification:counts", (counts) => {
        setNotificationCounts(queryClient, counts);
      }),
      realtime.on("friend:accepted", ({ friend }) => {
        invalidateSocialLists(queryClient);
        const sheets = useFriendSheetsStore.getState();
        if (sheets.qr !== null || sheets.friendsTabFocused) {
          void celebrateFriendOnce(friend.id, friend);
        }
      }),
      realtime.on("feed:stale", ({ authorId }) => {
        if (authorId === useAuthStore.getState().user?.id) return;
        void queryClient.invalidateQueries({
          queryKey: ["memories", "friends-map"],
          refetchType: "none",
        });
        useFeedStaleStore.getState().setMapStale(true);
      }),
    ];
    return () => offs.forEach((off) => off());
  }, [authenticated, queryClient]);
}
