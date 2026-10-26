export type NotificationPreferences = {
  /** Friend requests and accepts. */
  friendRequests: boolean;
  /** Being tagged in a memory or @mentioned in a message. */
  tags: boolean;
  /** New messages on your memories and ones you're tagged in. */
  messages: boolean;
  /** Reactions and message likes. Off by default. */
  likes: boolean;
  /** Daily push resurfacing a memory from this date. */
  onThisDay: boolean;
  /** "HH:MM", 24h, the user's local time. */
  onThisDayTime: string;
  /** The in-app nearby-friend banner (no push). */
  friendsNearby: boolean;
};

export type NotificationPreferencesPatch = Partial<NotificationPreferences> & {
  /** IANA zone, so On this day fires at local time. */
  timezone?: string;
};

export type DevicePlatform = "ios" | "android";
