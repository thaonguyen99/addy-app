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
