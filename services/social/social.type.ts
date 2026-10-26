import type { Friend, FriendRelationship } from "@/services/friends";
import type { PublicUser } from "@/services/users";

export type UserSearchResult = PublicUser & {
  relationship: FriendRelationship;
  mutualCount?: number;
};

export type InviteInfo = {
  token: string;
  /** Deep link (addyapp://add-friend?token=...) — encode this in the QR. */
  url: string;
  /** Landing page for people without the app. */
  webUrl: string;
};

/** Who an invite link or QR belongs to, as seen by you. */
export type InvitePreview = {
  user: PublicUser;
  mutualCount: number;
  placesCount: number;
  relationship: FriendRelationship | "self";
};

/** Opening someone's link makes you friends straight away. */
export type AcceptInviteResult = {
  status: "friends";
  friend: Friend;
};

export type BlockedUser = {
  user: PublicUser;
  blockedAt: string;
};
