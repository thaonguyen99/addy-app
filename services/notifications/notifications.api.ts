import { apiDelete, apiGet, apiPatch, apiPost } from "@/services/api/client";
import type { DevicePlatform, NotificationPreferences } from "./notifications.type";

async function registerDeviceToken(
  token: string,
  platform: DevicePlatform,
) {
  return apiPost<{ registered: boolean }>("/notifications/device-tokens", {
    token,
    platform,
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
  patch: Partial<NotificationPreferences>,
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
