export type NotificationPreferences = {
  /** Someone sent you a friend request. */
  friendRequests: boolean;
  /** Someone accepted yours, or added you through your invite. */
  friendAccepted: boolean;
  /** Being tagged in a memory or @mentioned in a message. */
  tags: boolean;
  /** New messages on your memories. */
  messages: boolean;
  /** Memory and message likes. Off by default. */
  likes: boolean;
  /** Daily local notification resurfacing a memory from this date. */
  onThisDay: boolean;
  /** "HH:MM", 24h, the user's local time. */
  onThisDayTime: string;
  /** IANA zone, so On this day fires at local time. */
  timezone: string;
  /** The in-app nearby-friend banner (no push). */
  friendsNearby: boolean;
};

export type NotificationPreferencesPatch = Partial<NotificationPreferences>;

export type DevicePlatform = "ios" | "android";
