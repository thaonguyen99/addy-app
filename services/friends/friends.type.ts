import type { PublicUser } from "@/services/users";

export type FriendRelationship =
  | "none"
  | "friend"
  | "request_sent"
  | "request_received";

/** The friend's newest memory you can see. */
export type LastSharedMemory = {
  memoryId: string;
  placeName: string;
  capturedAt: string;
};

export type Friend = {
  user: PublicUser;
  friendsSince: string;
  /** Null when they've shared nothing with you; absent on older servers. */
  lastSharedMemory?: LastSharedMemory | null;
};

export type FriendRequestDirection = "incoming" | "outgoing";

export type FriendRequest = {
  id: string;
  direction: FriendRequestDirection;
  user: PublicUser;
  status: "pending" | "accepted" | "declined" | "cancelled";
  createdAt: string;
  mutualCount?: number;
};

/** A friend of a friend you might know. */
export type FriendSuggestion = {
  user: PublicUser;
  mutualCount: number;
};
