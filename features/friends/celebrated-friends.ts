import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import type { PublicUser } from "@/services/users";
import { useFriendSheetsStore } from "@/stores/friend-sheets.store";

const KEY = "addy.celebratedFriendIds";
/** Plenty for "once per friend"; keeps the stored list from growing forever. */
const MAX_IDS = 500;

async function readIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

export async function markFriendCelebrated(userId: string): Promise<void> {
  try {
    const ids = await readIds();
    if (ids.includes(userId)) return;
    await AsyncStorage.setItem(KEY, JSON.stringify([...ids, userId].slice(-MAX_IDS)));
  } catch {
    // non-critical
  }
}

/**
 * Show "You're friends" unless this friend already got it (on this device):
 * a `friend:accepted` event while the invite or QR is on screen.
 */
export async function celebrateFriendOnce(
  userId: string,
  user?: PublicUser,
): Promise<void> {
  const ids = await readIds();
  if (ids.includes(userId)) return;
  useFriendSheetsStore.getState().openCelebrate({ userId, user });
}

/** The new friend's id from a "New friend" push payload, if it is one. */
export function newFriendIdFromPush(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const { type, userId } = data as { type?: unknown; userId?: unknown };
  return type === "FRIEND_ACCEPTED" && typeof userId === "string"
    ? userId
    : null;
}

/**
 * On launch: someone accepted or used your link while the app was closed.
 * Celebrate the newest such friend still sitting in the notification tray.
 */
export async function celebrateFromDeliveredPushes(): Promise<void> {
  try {
    const delivered = await Notifications.getPresentedNotificationsAsync();
    const newest = [...delivered]
      .sort((a, b) => b.date - a.date)
      .map((n) => newFriendIdFromPush(n.request.content.data))
      .filter((id): id is string => id !== null);
    const celebrated = await readIds();
    const next = newest.find((id) => !celebrated.includes(id));
    if (next) useFriendSheetsStore.getState().openCelebrate({ userId: next });
  } catch {
    // non-critical
  }
}
