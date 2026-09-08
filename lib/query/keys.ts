export const queryKeys = {
  profile: ["users", "me"] as const,
  stats: ["users", "stats"] as const,
  memory: (id: string) => ["memories", "detail", id] as const,
  memoriesFeed: ["memories", "feed"] as const,
  map: (boundsKey: string) => ["memories", "map", boundsKey] as const,
  placesNearby: (lat: number, lng: number) =>
    ["places", "nearby", lat.toFixed(5), lng.toFixed(5)] as const,
};

export function mapBoundsKey(bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}) {
  return `${bounds.north.toFixed(4)}:${bounds.south.toFixed(4)}:${bounds.east.toFixed(4)}:${bounds.west.toFixed(4)}`;
}
