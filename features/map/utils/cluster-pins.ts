export type ClusterablePin = {
  latitude: number;
  longitude: number;
};

export type ClusterGroup<T extends ClusterablePin> = {
  latitude: number;
  longitude: number;
  pins: T[];
};

/** Standard Web Mercator projection to pixel space at a given zoom (256px tiles). */
function project(lng: number, lat: number, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const x = ((lng + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

/**
 * Greedy pixel-distance clustering: groups pins within `pixelRadius` screen
 * pixels of each other at the given zoom level. A group of one pin is just
 * that pin, unclustered. Recompute this on every zoom/pan change.
 */
export function clusterPins<T extends ClusterablePin>(
  pins: readonly T[],
  zoom: number,
  pixelRadius = 60,
): ClusterGroup<T>[] {
  const points = pins.map((pin) => ({
    pin,
    ...project(pin.longitude, pin.latitude, zoom),
  }));
  const used = new Array(points.length).fill(false);
  const groups: ClusterGroup<T>[] = [];

  for (let i = 0; i < points.length; i += 1) {
    if (used[i]) continue;
    used[i] = true;
    const cluster = [points[i]];

    for (let j = i + 1; j < points.length; j += 1) {
      if (used[j]) continue;
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      if (Math.sqrt(dx * dx + dy * dy) <= pixelRadius) {
        used[j] = true;
        cluster.push(points[j]);
      }
    }

    const latitude =
      cluster.reduce((sum, p) => sum + p.pin.latitude, 0) / cluster.length;
    const longitude =
      cluster.reduce((sum, p) => sum + p.pin.longitude, 0) / cluster.length;
    groups.push({ latitude, longitude, pins: cluster.map((c) => c.pin) });
  }

  return groups;
}

/** Highest zoom most map styles render tiles for — flying in further gains
 * nothing, so it's the ceiling for deciding whether zooming can ever split
 * a cluster apart. */
const MAX_USEFUL_ZOOM = 20;

/**
 * True if these pins are close enough that no amount of zooming in will
 * ever separate them into individually-tappable markers — e.g. several
 * memories logged at the exact same coordinates. Tapping such a cluster
 * should offer a picker instead of flying to a zoom level that never
 * resolves anything.
 */
export function pinsAreInseparable<T extends ClusterablePin>(
  pins: readonly T[],
  pixelRadius = 60,
): boolean {
  if (pins.length < 2) return true;
  const points = pins.map((pin) => project(pin.longitude, pin.latitude, MAX_USEFUL_ZOOM));
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      const dx = points[i].x - points[j].x;
      const dy = points[i].y - points[j].y;
      if (Math.sqrt(dx * dx + dy * dy) > pixelRadius) {
        return false;
      }
    }
  }
  return true;
}
