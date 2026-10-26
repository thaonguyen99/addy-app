export type NotificationPreferences = {
  friendRequestReceived: boolean;
  friendRequestAccepted: boolean;
  reactionReceived: boolean;
  messages: boolean;
};

export type DevicePlatform = "ios" | "android";
