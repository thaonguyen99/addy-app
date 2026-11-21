export const queryKeys = {
  profile: ["users", "me"] as const,
  stats: ["users", "stats"] as const,
  memory: (id: string) => ["memories", "detail", id] as const,
  memoriesFeed: ["memories", "feed"] as const,
  /** Memory Lane (`GET /feed`) — distinct from `memoriesFeed` (your own list). */
  feed: ["feed"] as const,
  map: (boundsKey: string, userId: string | undefined) =>
    ["memories", "map", boundsKey, userId] as const,
  friendsMap: (boundsKey: string, userId: string | undefined) =>
    ["memories", "friends-map", boundsKey, userId] as const,
  /** `placeIdsKey`: the sorted place ids, joined. */
  memoriesByPlaces: (scope: string, placeIdsKey: string, userId: string | undefined) =>
    ["memories", "by-places", scope, placeIdsKey, userId] as const,
  /** Coordinates rounded to ~100 m so nearby clusters share one lookup. */
  areaName: (lat: number, lng: number) =>
    ["places", "area", lat.toFixed(3), lng.toFixed(3)] as const,
  memoryReactions: (id: string) => ["memories", "reactions", id] as const,
  memoryMessages: (id: string) => ["memories", "messages", id] as const,
  memoryMentionable: (id: string) =>
    ["memories", "mentionable", id] as const,
  placesNearby: (lat: number, lng: number) =>
    ["places", "nearby", lat.toFixed(5), lng.toFixed(5)] as const,
  friends: ["friends"] as const,
  friendRequests: (direction: "incoming" | "outgoing") =>
    ["friends", "requests", direction] as const,
  friendSuggestions: ["friends", "suggestions"] as const,
  userSearch: (q: string) => ["users", "search", q] as const,
  /** Prefixes: `["users", "profile"]` and `["users", "profile-memories"]`. */
  userProfile: (username: string) =>
    ["users", "profile", username.toLowerCase()] as const,
  userMemories: (username: string) =>
    ["users", "profile-memories", username.toLowerCase()] as const,
  invite: ["users", "invite"] as const,
  blockedUsers: ["blocks"] as const,
  notificationPreferences: ["notifications", "preferences"] as const,
  notifications: ["notifications", "list"] as const,
  notificationCounts: ["notifications", "counts"] as const,
  /** Your memories from today's date in earlier years, in zone `tz`. */
  onThisDay: (tz: string) => ["memories", "on-this-day", tz] as const,
};

export function mapBoundsKey(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
  limit?: number;
  cursor?: string;
}) {
  const { north, south, east, west, limit = 50, cursor = "" } = bounds;
  return [north, south, east, west, limit, cursor].join(":");
}
