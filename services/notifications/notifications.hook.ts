import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useAuthStore } from "@/stores/auth.store";
import { queryKeys } from "@/services/query/keys";
import { notificationApi } from "./notifications.api";
import {
  markNotificationsRead,
  setNotificationCounts,
} from "./notifications.cache";
import type {
  NotificationPreferences,
  NotificationPreferencesPatch,
} from "./notifications.type";

/** The 🔔 list: `pages[0]` is the newest page. */
export function useNotificationsQuery() {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications,
    queryFn: ({ pageParam }) => notificationApi.listNotifications(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
  });
}

/** `badge` drives the bell; the socket keeps it current while connected. */
export function useNotificationCountsQuery() {
  const authenticated = useAuthStore((s) => s.status === "authenticated");
  return useQuery({
    queryKey: queryKeys.notificationCounts,
    queryFn: notificationApi.getCounts,
    enabled: authenticated,
  });
}

/** The list was opened: clears the badge on every device. */
export function useMarkNotificationsSeenMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markSeen,
    onSuccess: (counts) => setNotificationCounts(queryClient, counts),
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onMutate: (id) => markNotificationsRead(queryClient, [id]),
    onSuccess: (counts) => setNotificationCounts(queryClient, counts),
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markAllRead,
    onMutate: () => markNotificationsRead(queryClient),
    onSuccess: (counts) => setNotificationCounts(queryClient, counts),
    onError: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  });
}

export function useNotificationPreferencesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notificationPreferences,
    queryFn: notificationApi.getNotificationPreferences,
    enabled,
  });
}

export function useUpdateNotificationPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: NotificationPreferencesPatch) =>
      notificationApi.updateNotificationPreferences(patch),
    onMutate: async (patch) => {
      const key = queryKeys.notificationPreferences;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<NotificationPreferences>(key);
      if (previous) {
        queryClient.setQueryData<NotificationPreferences>(key, {
          ...previous,
          ...patch,
        });
      }
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.notificationPreferences,
          context.previous,
        );
      }
    },
    onSuccess: (prefs) => {
      queryClient.setQueryData(queryKeys.notificationPreferences, prefs);
    },
  });
}
