import { router } from "expo-router";

import { openProfile } from "@/features/profile/open-profile";
import {
  findNotification,
  markNotificationsRead,
  NotificationApi,
  type NotificationDto,
  type PushData,
  setNotificationCounts,
} from "@/services/notifications";
import { queryClient } from "@/services/query/client";

/** Everything a tap needs, from a 🔔 row, a push, or an in-app banner. */
export type NotificationTarget = {
  type: PushData["type"];
  notificationId?: string;
  memoryId?: string;
  commentId?: string;
  userId?: string;
  username?: string;
};

export function targetFromRow(row: NotificationDto): NotificationTarget {
  return {
    type: row.type,
    notificationId: row.id,
    memoryId: row.data.memoryId,
    commentId: row.data.commentId,
    userId: row.target.type === "user" ? row.target.id : undefined,
    username: row.target.type === "user" ? row.actors[0]?.username : undefined,
  };
}

/** A push's `data`, if it's one of ours. */
export function targetFromPushData(data: unknown): NotificationTarget | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (typeof d.type !== "string") return null;
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  return {
    type: d.type as PushData["type"],
    notificationId: str(d.notificationId),
    memoryId: str(d.memoryId),
    commentId: str(d.commentId),
    userId: str(d.userId) ?? str(d.actorId),
    username: str(d.username),
  };
}

/** Older pushes only carry the user id: find the username on the row. */
async function resolveUsername(
  target: NotificationTarget,
): Promise<string | undefined> {
  if (target.username) return target.username;
  if (!target.notificationId) return undefined;
  const cached = findNotification(queryClient, target.notificationId);
  if (cached) return cached.actors[0]?.username;
  try {
    const page = await NotificationApi.listNotifications();
    return page.items.find((row) => row.id === target.notificationId)
      ?.actors[0]?.username;
  } catch {
    return undefined;
  }
}

function markRead(notificationId: string | undefined) {
  if (!notificationId) return;
  markNotificationsRead(queryClient, [notificationId]);
  NotificationApi.markRead(notificationId)
    .then((counts) => setNotificationCounts(queryClient, counts))
    .catch(() => {
      // 404: already gone (deleted memory, block). Nothing to mark.
    });
}

/**
 * The one place a notification tap is routed, whatever it came from. Opens
 * the screen first, then marks the row read.
 */
export async function openNotificationTarget(
  target: NotificationTarget,
): Promise<void> {
  switch (target.type) {
    case "FRIEND_REQUEST":
    case "FRIEND_ACCEPTED": {
      const username = await resolveUsername(target);
      if (username) openProfile(username);
      else
        router.navigate(
          target.type === "FRIEND_REQUEST"
            ? "/(app)/(tabs)/friends?tab=incoming"
            : "/(app)/(tabs)/friends",
        );
      break;
    }
    case "ON_THIS_DAY":
      if (target.memoryId) {
        router.push({
          pathname: "/memory/[id]",
          params: { id: target.memoryId, reveal: "on-this-day" },
        });
      }
      break;
    case "TAGGED":
    case "MEMORY_LIKE":
    case "MEMORY_MESSAGE":
    case "MENTIONED":
    case "COMMENT_LIKE":
      if (target.memoryId) {
        // Likes on the memory itself land at the top; anything about a
        // message scrolls to it.
        const scrollTo =
          target.type === "TAGGED" || target.type === "MEMORY_LIKE"
            ? undefined
            : target.commentId;
        router.push({
          pathname: "/memory/[id]",
          params: {
            id: target.memoryId,
            ...(scrollTo ? { messageId: scrollTo } : {}),
          },
        });
      }
      break;
  }
  markRead(target.notificationId);
}
