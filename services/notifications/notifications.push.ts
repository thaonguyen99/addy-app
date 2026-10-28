import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { notificationApi } from "./notifications.api";
import type { DevicePlatform } from "./notifications.type";

const TOKEN_KEY = "addy.pushToken";
const ASKED_KEY = "addy.pushPermissionAsked";
export const ANDROID_CHANNEL_ID = "default";

/** The phone's IANA zone ("Asia/Ho_Chi_Minh"), so On this day fires at local time. */
export function deviceTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

/** The token the backend has for this device, this session. */
let lastRegisteredToken: string | null = null;

/**
 * Foreground presentation: suppress the OS banner. The app shows its own
 * Addy-styled banner instead (see InAppNotificationBanner).
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

/** Android 13+ only shows the permission prompt once a channel exists. */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Default",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

function projectId(): string | undefined {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
  );
}

async function getExpoPushToken(): Promise<string | null> {
  const id = projectId();
  if (!Device.isDevice || !id) return null;
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId: id });
  return data ?? null;
}

/**
 * Register this device's Expo push token with the backend when permission is
 * already granted. Never prompts. Safe to call on every launch and whenever
 * the token changes: it de-dupes and never throws.
 */
export async function syncPushToken(): Promise<void> {
  try {
    if (!Device.isDevice) return;
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return;
    await ensureAndroidChannel();

    const token = await getExpoPushToken();
    if (!token || token === lastRegisteredToken) return;

    await notificationApi.registerPushToken(
      token,
      Platform.OS as DevicePlatform,
      deviceTimezone(),
    );
    lastRegisteredToken = token;
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (error) {
    console.warn("[push] token sync failed", error);
  }
}

/**
 * Ask for notification permission at a natural moment (after onboarding, the
 * first friend action). Asks at most once on this device; Settings ›
 * Notifications has the Turn on button after that.
 */
export async function requestPushPermission(): Promise<void> {
  try {
    if (!Device.isDevice) return;
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) {
      await syncPushToken();
      return;
    }
    if (!current.canAskAgain) return;
    if (await AsyncStorage.getItem(ASKED_KEY)) return;

    await ensureAndroidChannel();
    await AsyncStorage.setItem(ASKED_KEY, "1");
    const asked = await Notifications.requestPermissionsAsync();
    if (asked.granted) await syncPushToken();
  } catch (error) {
    console.warn("[push] permission request failed", error);
  }
}

/**
 * Remove this device's token from the backend while the session is still
 * valid (sign-out, account deletion). Best-effort and time-boxed so it never
 * stalls the caller.
 */
export async function unregisterPushToken(): Promise<void> {
  lastRegisteredToken = null;
  try {
    // Forget the token before the request: if the session is already dead,
    // the 401 → sign-out path re-enters here and must find nothing to do.
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!token) return;
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await Promise.race([
      notificationApi.deletePushToken(token),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch {
    // ignore: the backend also prunes dead tokens on send
  }
}
