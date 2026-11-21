import type { MapBounds } from "./memories.type";

export function containsViewport(outer: MapBounds, inner: MapBounds): boolean {
  return (
    inner.west <= inner.east &&
    inner.south <= inner.north &&
    outer.west <= inner.west &&
    outer.east >= inner.east &&
    outer.south <= inner.south &&
    outer.north >= inner.north
  );
}

function bufferedRange(min: number, max: number, limit: number) {
  const span = max - min;
  if (span <= 0) return [min, max] as const;

  // Snap outward so returning to the same area can reuse the same query.
  const step = 2 ** Math.floor(Math.log2(span / 4));
  return [
    Math.max(-limit, (Math.floor(min / step) - 1) * step),
    Math.min(limit, (Math.ceil(max / step) + 1) * step),
  ] as const;
}

export function bufferedViewport(bounds: MapBounds): MapBounds {
  if (bounds.cursor || !containsViewport(bounds, bounds)) return bounds;

  const [south, north] = bufferedRange(bounds.south, bounds.north, 90);
  const [west, east] = bufferedRange(bounds.west, bounds.east, 180);
  return { ...bounds, south, north, west, east };
}

export function updateMapViewport(
  previous: { visible: MapBounds; buffered: MapBounds },
  visible: MapBounds,
) {
  const buffered = previous.buffered;
  const previousSpan = previous.visible.east - previous.visible.west;
  const span = visible.east - visible.west;
  const sameScale = span >= previousSpan / 2 && span <= previousSpan * 2;
  // Compare against the retained window too, so repeated zoom-in gestures
  // eventually release an oversized buffer even if each step is small.
  const bufferFits = buffered.east - buffered.west <= span * 2;
  return {
    visible,
    buffered:
      sameScale && bufferFits && containsViewport(buffered, visible)
        ? buffered
        : bufferedViewport(visible),
  };
}
