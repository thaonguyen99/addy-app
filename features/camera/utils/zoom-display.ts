/**
 * expo-camera `zoom` is 0–1 of the device maximum. Map to a compact × label for the UI
 * (relative scale, not optical telephoto metadata).
 */
export function normalizedZoomToDisplayLabel(zoom: number): string {
  const z = Math.min(1, Math.max(0, zoom));
  const display = 1 + z * 4;
  return `${display.toFixed(1)}×`;
}
