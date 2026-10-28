/**
 * Mirror of addy-be `src/contracts/notifications.ts`: notification types, the
 * inbox row shape, push data, socket event names and their payloads. Keep it
 * in sync with the backend; only the DTO imports point at the app's types.
 */
import type { MemoryDetail as MemoryDetailDto } from "@/services/memories/memories.type";
import type { MemoryMessage as MemoryMessageDto } from "@/services/messages/messages.type";
import type { PublicUser as PublicUserDto } from "@/services/users/users.type";

// ---------------------------------------------------------------------------
// Notification types
// ---------------------------------------------------------------------------

export const NOTIFICATION_TYPES = [
  /** → the addressee of a friend request. Target: the requester. */
  "FRIEND_REQUEST",
  /** → the original requester, or the inviter after an invite/QR add. Target: the new friend. */
  "FRIEND_ACCEPTED",
  /** → each newly tagged user. Target: the memory. */
  "TAGGED",
  /** → each friend @mentioned in a message. Target: the message. */
  "MENTIONED",
  /** → the memory owner. Grouped per memory. Target: the memory. */
  "MEMORY_MESSAGE",
  /** → the memory owner, first like per user only. Grouped. Target: the memory. */
  "MEMORY_LIKE",
  /** → the message author, first like per user only. Grouped. Target: the message. */
  "COMMENT_LIKE",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationTargetType = "memory" | "comment" | "user";

export type NotificationTarget = {
  type: NotificationTargetType;
  id: string;
};

export type NotificationActorDto = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

/** Snapshot taken when the row was last updated; not kept in sync after. */
export type NotificationData = {
  memoryId?: string;
  /** The latest message (MEMORY_MESSAGE, MENTIONED) or the liked one (COMMENT_LIKE). */
  commentId?: string;
  /** Latest message text, up to 100 chars. */
  preview?: string;
  /** The memory's cover photo. */
  thumbUrl?: string;
  placeName?: string;
  /** The memory's caption (TAGGED). */
  caption?: string;
  /** FRIEND_ACCEPTED only: "invite" when they added you via your invite link/QR. */
  via?: "invite";
};

/** One row of `GET /notifications`, and the `notification:upsert` payload. */
export type NotificationDto = {
  id: string;
  type: NotificationType;
  target: NotificationTarget;
  /** Up to 3 visible actors, most recent first. */
  actors: NotificationActorDto[];
  /** Distinct visible actors in the group ("hanni and {actorCount - 1} others"). */
  actorCount: number;
  data: NotificationData;
  /** Null while unread (tinted row). */
  readAt: string | null;
  createdAt: string;
  /** Bumped each time an event is grouped in; the list is ordered by it. */
  updatedAt: string;
};

/** `GET /notifications/unread-count`, and the `notification:counts` payload. */
export type NotificationCounts = {
  /** Unread rows updated since the list was last opened: the 🔔 badge. */
  badge: number;
  /** All rows with `readAt = null`. */
  unread: number;
};

/** `data` on every push. On this day is sent locally by the app, except to pre-v2 builds. */
export type PushData = {
  type: NotificationType | "ON_THIS_DAY";
  notificationId?: string;
  memoryId?: string;
  commentId?: string;
  userId?: string;
  /** Friend types: the other user's username, to open their profile. */
  username?: string;
  /** @deprecated FRIEND_ACCEPTED only, same as `userId`; for pre-inbox builds. */
  actorId?: string;
  /** Deep link (`addyapp://…`), kept for builds that route on it. */
  url: string;
};

// ---------------------------------------------------------------------------
// Wording (shared by push and the in-app rows)
// ---------------------------------------------------------------------------

const PREVIEW_PUSH_CHARS = 40;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** "hanni", "hanni and 1 other", "hanni and 2 others". */
export function actorPhrase(
  actors: Pick<NotificationActorDto, "username">[],
  actorCount: number,
): string {
  const lead = actors[0]?.username ?? "Someone";
  const others = Math.max(actorCount - 1, 0);
  if (others === 0) return lead;
  return `${lead} and ${others} ${others === 1 ? "other" : "others"}`;
}

/**
 * Push title/body for a row. The in-app row shows `title`, and the app may
 * add `body` as its second line.
 */
export function formatNotification(
  n: Pick<NotificationDto, "type" | "actors" | "actorCount" | "data">,
): { title: string; body?: string } {
  const who = actorPhrase(n.actors, n.actorCount);
  const quote = n.data.preview
    ? `“${truncate(n.data.preview, PREVIEW_PUSH_CHARS)}”`
    : undefined;
  switch (n.type) {
    case "FRIEND_REQUEST":
      return { title: `${who} wants to be friends` };
    case "FRIEND_ACCEPTED":
      return {
        title:
          n.data.via === "invite"
            ? `${who} is now your friend`
            : `${who} accepted your friend request`,
      };
    case "TAGGED": {
      const parts = [
        n.data.placeName ? `📍 ${n.data.placeName}` : undefined,
        n.data.caption ? `“${truncate(n.data.caption, PREVIEW_PUSH_CHARS)}”` : undefined,
      ].filter(Boolean);
      return {
        title: `${who} tagged you`,
        ...(parts.length > 0 ? { body: parts.join(" · ") } : {}),
      };
    }
    case "MENTIONED":
      return { title: `${who} mentioned you`, ...(quote ? { body: quote } : {}) };
    case "MEMORY_MESSAGE":
      return { title: `${who} in your memory`, ...(quote ? { body: quote } : {}) };
    case "MEMORY_LIKE":
      return { title: `${who} liked your memory` };
    case "COMMENT_LIKE":
      return { title: `${who} liked your message` };
  }
}

// ---------------------------------------------------------------------------
// Socket.IO
// ---------------------------------------------------------------------------

/**
 * Connect with `io(BASE_URL, { auth: { token: accessToken } })`. A bad or
 * expired token fails with `connect_error` ("UNAUTHORIZED"); the server also
 * disconnects when the token expires, so reconnect with a fresh one.
 * Each socket joins `user:{id}` automatically.
 */
export const SOCKET_EVENTS = {
  // client → server
  MEMORY_JOIN: "memory:join",
  MEMORY_LEAVE: "memory:leave",
  // server → client: user:{id}
  NOTIFICATION_UPSERT: "notification:upsert",
  NOTIFICATION_REMOVED: "notification:removed",
  NOTIFICATION_COUNTS: "notification:counts",
  FRIEND_ACCEPTED: "friend:accepted",
  FEED_STALE: "feed:stale",
  // server → client: memory:{id}
  COMMENT_CREATED: "comment:created",
  COMMENT_UPDATED: "comment:updated",
  COMMENT_DELETED: "comment:deleted",
  COMMENT_LIKE_COUNT: "comment:likeCount",
  MEMORY_LIKE_COUNT: "memory:likeCount",
  MEMORY_UPDATED: "memory:updated",
  MEMORY_UNAVAILABLE: "memory:unavailable",
} as const;

export type MemoryJoinAck =
  | { ok: true }
  | { ok: false; error: "NOT_FOUND" | "BAD_REQUEST" };

export type LikeCountPayload = {
  /** The memory id (memory:likeCount) or the message id (comment:likeCount). */
  id: string;
  /** As this viewer would count it via REST (block-filtered). */
  count: number;
  updatedAt: string;
};

export type CommentCreatedPayload = MemoryMessageDto & {
  memoryId: string;
  /** Echo of the `clientTempId` sent on `POST /memories/:id/messages`, to swap out the optimistic bubble. */
  clientTempId?: string;
};

export type CommentUpdatedPayload = MemoryMessageDto & { memoryId: string };

export type CommentDeletedPayload = {
  id: string;
  memoryId: string;
  updatedAt: string;
};

export type FriendAcceptedPayload = {
  friend: PublicUserDto;
  friendsSince: string;
};

export type FeedStalePayload = {
  memoryId: string;
  authorId: string;
};

export interface ServerToClientEvents {
  "notification:upsert": (payload: NotificationDto) => void;
  /** Rows removed server-side (e.g. after a block); drop them from the list. */
  "notification:removed": (payload: { ids: string[] }) => void;
  "notification:counts": (payload: NotificationCounts) => void;
  "friend:accepted": (payload: FriendAcceptedPayload) => void;
  /** A friend shared a memory: refetch the feed/map when convenient. */
  "feed:stale": (payload: FeedStalePayload) => void;
  "comment:created": (payload: CommentCreatedPayload) => void;
  "comment:updated": (payload: CommentUpdatedPayload) => void;
  "comment:deleted": (payload: CommentDeletedPayload) => void;
  "comment:likeCount": (payload: LikeCountPayload) => void;
  "memory:likeCount": (payload: LikeCountPayload) => void;
  /** Full `GET /memories/:id` shape as this viewer sees it. */
  "memory:updated": (payload: MemoryDetailDto) => void;
  /** Deleted, made private, or no longer visible to you. You've been removed from the room. */
  "memory:unavailable": (payload: { id: string }) => void;
}

export interface ClientToServerEvents {
  "memory:join": (memoryId: string, ack: (result: MemoryJoinAck) => void) => void;
  "memory:leave": (memoryId: string, ack?: (result: { ok: true }) => void) => void;
}
