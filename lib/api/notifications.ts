import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type {
  DevicePlatform,
  NotificationPreferences,
} from "@/types/api";

export async function registerDeviceToken(
  token: string,
  platform: DevicePlatform,
) {
  return apiPost<{ registered: boolean }>("/notifications/device-tokens", {
    token,
    platform,
  });
}

export async function deleteDeviceToken(token: string) {
  return apiDelete<{ removed: boolean }>("/notifications/device-tokens", {
    token,
  });
}

export async function getNotificationPreferences() {
  return apiGet<NotificationPreferences>("/notifications/preferences");
}

export async function updateNotificationPreferences(
  patch: Partial<NotificationPreferences>,
) {
  return apiPatch<NotificationPreferences>(
    "/notifications/preferences",
    patch,
  );
}
