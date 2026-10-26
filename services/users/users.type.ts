import type { AuthUser } from "@/services/auth";

/** Minimal public identity for another user (friend, requester, reactor). */
export type PublicUser = {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
};

export type UserProfile = AuthUser & {
  createdAt: string;
};

export type UpdateProfileInput = {
  /** Never null — a username can be changed but not cleared. */
  username?: string;
  name?: string | null;
  bio?: string | null;
  avatarUrl?: string;
  avatarPublicId?: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type UsernameAvailableResult = {
  available: boolean;
};

export type UserStats = {
  totalMemories: number;
  placesVisited: number;
};

export type ProfileRelationship =
  | "self"
  | "friend"
  | "none"
  | "request_sent"
  | "request_received"
  | "blocked_by_me";

/** GET /users/:username/profile — the header anyone signed in can see. */
export type UserProfilePage = {
  user: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
  };
  relationship: ProfileRelationship;
  stats: { memories: number; places: number; friends: number };
  /** Omitted for self and blocked_by_me. */
  mutualFriends?: {
    count: number;
    preview: { id: string; username: string; avatarUrl: string | null }[];
  };
  /** Only when relationship === "friend". */
  friendsSince?: string;
};

/** One tile in a profile's memory grid. */
export type ProfileMemoryItem = {
  id: string;
  thumbnailUrl: string;
  feeling: string | null;
  moodScore: number | null;
  placeName: string;
  createdAt: string;
  /** Only on your own grid. */
  visibility?: "friends" | "private";
};
