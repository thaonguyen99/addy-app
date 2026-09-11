export const queryKeys = {
  profile: ["users", "me"] as const,
  stats: ["users", "stats"] as const,
  memory: (id: string) => ["memories", "detail", id] as const,
  memoriesFeed: ["memories", "feed"] as const,
  map: (boundsKey: string) => ["memories", "map", boundsKey] as const,
  friendsMap: (boundsKey: string) =>
    ["memories", "friends-map", boundsKey] as const,
  placeMemories: (placeId: string) =>
    ["memories", "place", placeId] as const,
  memoryReactions: (id: string) => ["memories", "reactions", id] as const,
  placesNearby: (lat: number, lng: number) =>
    ["places", "nearby", lat.toFixed(5), lng.toFixed(5)] as const,
  friends: ["friends"] as const,
  friendRequests: (direction: "incoming" | "outgoing") =>
    ["friends", "requests", direction] as const,
  userSearch: (q: string) => ["users", "search", q] as const,
  invite: ["users", "invite"] as const,
  blockedUsers: ["blocks"] as const,
  notificationPreferences: ["notifications", "preferences"] as const,
};

export function mapBoundsKey(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}) {
  return `${bounds.north.toFixed(4)}:${bounds.south.toFixed(4)}:${bounds.east.toFixed(4)}:${bounds.west.toFixed(4)}`;
}
