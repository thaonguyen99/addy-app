import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/services/query/keys";
import type { Paginated } from "@/types/api";
import type {
  NotificationCounts,
  NotificationDto,
} from "./notifications.contract";

export type NotificationPages = InfiniteData<Paginated<NotificationDto>, unknown>;

export function setNotificationCounts(
  queryClient: QueryClient,
  counts: NotificationCounts,
) {
  queryClient.setQueryData(queryKeys.notificationCounts, counts);
}

/** Every loaded row, newest first, deduped across pages. */
export function flattenNotificationPages(data: NotificationPages | undefined) {
  if (!data) return [];
  const seen = new Set<string>();
  return data.pages
    .flatMap((page) => page.items)
    .filter((row) => {
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    });
}

/**
 * A new or regrouped row: drop any older copy and put it on top. Without a
 * loaded list there's nothing to patch; the next open fetches it.
 */
export function upsertNotification(
  queryClient: QueryClient,
  row: NotificationDto,
) {
  queryClient.setQueryData<NotificationPages>(
    queryKeys.notifications,
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page, i) => {
          const items = page.items.filter((item) => item.id !== row.id);
          return { ...page, items: i === 0 ? [row, ...items] : items };
        }),
      },
  );
}

export function removeNotifications(queryClient: QueryClient, ids: string[]) {
  const drop = new Set(ids);
  queryClient.setQueryData<NotificationPages>(
    queryKeys.notifications,
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.filter((item) => !drop.has(item.id)),
        })),
      },
  );
}

/** Mark rows read locally (`ids` omitted: every row). */
export function markNotificationsRead(queryClient: QueryClient, ids?: string[]) {
  const now = new Date().toISOString();
  queryClient.setQueryData<NotificationPages>(
    queryKeys.notifications,
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.map((item) =>
            item.readAt === null && (!ids || ids.includes(item.id))
              ? { ...item, readAt: now }
              : item,
          ),
        })),
      },
  );
}

export function findNotification(
  queryClient: QueryClient,
  id: string,
): NotificationDto | undefined {
  return flattenNotificationPages(
    queryClient.getQueryData<NotificationPages>(queryKeys.notifications),
  ).find((row) => row.id === id);
}
