import type { MemoryPin } from "@/types/api";

/**
 * A faint hairline trail connecting pins in the order they were captured —
 * deliberately near-invisible (see the LineLayer paint in
 * memories-map-screen.tsx), just a hint that "there's a path here."
 */
export function pinsToTrailGeoJSON(pins: MemoryPin[]): GeoJSON.Feature<GeoJSON.LineString> {
  const ordered = [...pins].sort(
    (a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime(),
  );

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: ordered.map((pin) => [pin.longitude, pin.latitude]),
    },
  };
}
