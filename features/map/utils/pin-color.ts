/** Stable color pool for map pins — picked deterministically per memory. */
export const PIN_COLOR_POOL = [
  "#8CCB5E",
  "#FFD84D",
  "#FF8FC4",
  "#7FCBF5",
  "#A99BF0",
] as const;

/** djb2 string hash — deterministic, no Math.random(). */
function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash >>> 0;
}

type PinColorSource = {
  id: string;
  /** Future user-chosen color — not a real field yet, overrides the
   *  derived color the moment it is. */
  pinColor?: string | null;
};

/** Stable per-memory pin color: same id always yields the same color. */
export function getPinColor(memory: PinColorSource): string {
  if (memory.pinColor) return memory.pinColor;
  const index = hashString(memory.id) % PIN_COLOR_POOL.length;
  return PIN_COLOR_POOL[index];
}
