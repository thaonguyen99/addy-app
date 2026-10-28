import * as Notifications from "expo-notifications";

import { MOOD_SCORE_OPTIONS } from "@/features/camera/constants/mood-score";
import { memoryApi } from "@/services/memories/memories.api";
import type { OnThisDayMemory } from "@/services/memories/memories.type";
import {
  ANDROID_CHANNEL_ID,
  deviceTimezone,
  NotificationApi,
  type NotificationPreferences,
  type PushData,
} from "@/services/notifications";
import { queryClient } from "@/services/query/client";
import { queryKeys } from "@/services/query/keys";

const NOTIFICATION_ID = "on-this-day";

function yearsAgoText(years: number): string {
  return years === 1 ? "One year ago" : `${years} years ago`;
}

function content(memory: OnThisDayMemory): Notifications.NotificationContentInput {
  const mood = MOOD_SCORE_OPTIONS.find((o) => o.score === memory.moodScore);
  const data: PushData = {
    type: "ON_THIS_DAY",
    memoryId: memory.id,
    url: `addyapp://memory/${memory.id}?reveal=on-this-day`,
  };
  return {
    title: `On this day ${mood?.emoji ?? "✦"}`,
    body: `${yearsAgoText(memory.yearsAgo)} you were at ${memory.place.name}. Tap to relive it.`,
    data,
  };
}

/** Today at "HH:MM" on the phone's clock, or null if that's already past. */
function fireDateToday(time: string): Date | null {
  const [hours, minutes] = time.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.getTime() > Date.now() ? date : null;
}

async function reschedule(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);

  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;

  const prefs = await queryClient.fetchQuery<NotificationPreferences>({
    queryKey: queryKeys.notificationPreferences,
    queryFn: NotificationApi.getNotificationPreferences,
    // Fresh from a settings change is good enough; no need to refetch.
    staleTime: 30_000,
  });
  if (!prefs.onThisDay) return;
  const date = fireDateToday(prefs.onThisDayTime);
  if (!date) return;

  const tz = deviceTimezone() ?? "UTC";
  const memories = await queryClient.fetchQuery({
    queryKey: queryKeys.onThisDay(tz),
    queryFn: () => memoryApi.listOnThisDay(tz),
    staleTime: 5 * 60_000,
  });
  const memory = memories[0];
  if (!memory) return;

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: content(memory),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: ANDROID_CHANNEL_ID,
    },
  });
}

let running: Promise<void> = Promise.resolve();

/**
 * On this day is a local notification: when today has memories from earlier
 * years, schedule one for the chosen time. Called on app open, on foreground,
 * and when the setting changes. It only covers today, so a day the app isn't
 * opened before that time gets none.
 */
export function rescheduleOnThisDay(): Promise<void> {
  running = running
    .then(reschedule)
    .catch((error) => console.warn("[on-this-day] schedule failed", error));
  return running;
}
