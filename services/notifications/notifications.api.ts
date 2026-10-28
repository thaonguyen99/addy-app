import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from "@/services/api/client";
import type { Paginated } from "@/types/api";
import type {
  NotificationCounts,
  NotificationDto,
} from "./notifications.contract";
import type {
  DevicePlatform,
  NotificationPreferences,
  NotificationPreferencesPatch,
} from "./notifications.type";

export const NOTIFICATIONS_PAGE_SIZE = 30;

/** The 🔔 list, newest `updatedAt` first. */
async function listNotifications(
  cursor?: string,
): Promise<Paginated<NotificationDto>> {
  return apiGetPaginated<NotificationDto>("/notifications", {
    limit: NOTIFICATIONS_PAGE_SIZE,
    cursor,
  });
}

async function getCounts() {
  return apiGet<NotificationCounts>("/notifications/unread-count");
}

/** The list was opened: clears the badge, rows stay unread. */
async function markSeen() {
  return apiPost<NotificationCounts>("/notifications/seen");
}

async function markRead(id: string) {
  return apiPost<NotificationCounts>(`/notifications/${id}/read`);
}

async function markAllRead() {
  return apiPost<NotificationCounts>("/notifications/read-all");
}

/**
 * `schedulesOnThisDay`: this build schedules On this day as a local
 * notification, so the server doesn't push it too.
 */
async function registerPushToken(
  token: string,
  platform: DevicePlatform,
  timezone?: string,
) {
  return apiPost<unknown>("/push-tokens", {
    token,
    platform,
    schedulesOnThisDay: true,
    ...(timezone ? { timezone } : {}),
  });
}

/** Expo tokens contain `[ ]`, so encode them for the path. */
async function deletePushToken(token: string) {
  return apiDelete<unknown>(`/push-tokens/${encodeURIComponent(token)}`);
}

async function getNotificationPreferences() {
  return apiGet<NotificationPreferences>("/notification-preferences");
}

async function updateNotificationPreferences(
  patch: NotificationPreferencesPatch,
) {
  return apiPatch<NotificationPreferences>("/notification-preferences", patch);
}

export const notificationApi = {
  listNotifications,
  getCounts,
  markSeen,
  markRead,
  markAllRead,
  registerPushToken,
  deletePushToken,
  getNotificationPreferences,
  updateNotificationPreferences,
};
