import { apiDelete, apiGet, apiPatch, apiPost } from "@/services/api/client";
import type {
  DevicePlatform,
  NotificationPreferences,
  NotificationPreferencesPatch,
} from "./notifications.type";

async function registerDeviceToken(
  token: string,
  platform: DevicePlatform,
  timezone?: string,
) {
  return apiPost<{ registered: boolean }>("/notifications/device-tokens", {
    token,
    platform,
    ...(timezone ? { timezone } : {}),
  });
}

async function deleteDeviceToken(token: string) {
  return apiDelete<{ removed: boolean }>("/notifications/device-tokens", {
    token,
  });
}

async function getNotificationPreferences() {
  return apiGet<NotificationPreferences>("/notifications/preferences");
}

async function updateNotificationPreferences(
  patch: NotificationPreferencesPatch,
) {
  return apiPatch<NotificationPreferences>(
    "/notifications/preferences",
    patch,
  );
}

export const notificationApi = {
  registerDeviceToken,
  deleteDeviceToken,
  getNotificationPreferences,
  updateNotificationPreferences,
};
