import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { notificationApi } from "./notifications.api";
import type { DevicePlatform } from "./notifications.type";

let lastRegisteredToken: string | null = null;

/**
 * Foreground presentation — suppress the OS banner; useInAppNotifications
 * shows the Addy-styled InAppNotificationBanner instead.
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Ask for permission (once), get the Expo push token, and register it with the
 * backend. Safe to call on every authenticated mount — it de-dupes and never
 * throws.
 */
export async function registerForPush(): Promise<void> {
  try {
    if (!Device.isDevice) return;

    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.granted;
    if (!granted && existing.canAskAgain) {
      const asked = await Notifications.requestPermissionsAsync();
      granted = asked.granted;
    }
    if (!granted) return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    if (!token || token === lastRegisteredToken) return;

    await notificationApi.registerDeviceToken(token, Platform.OS as DevicePlatform);
    lastRegisteredToken = token;
  } catch (error) {
    console.warn("[push] registration failed", error);
  }
}

/** Best-effort current token (for cleanup on sign-out). */
export async function getCurrentPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) return null;
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) return null;
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data ?? null;
  } catch {
    return null;
  }
}

export function resetPushRegistrationCache(): void {
  lastRegisteredToken = null;
}
