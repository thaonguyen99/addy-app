/** djb2 string hash — deterministic, no Math.random(). */
export function hashString(input: string): number {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return hash >>> 0;
}

/** Stable tilt in [-maxDeg, maxDeg] derived from `seed`. */
export function stableTiltDeg(seed: string, maxDeg = 10): number {
  const steps = maxDeg * 2 + 1;
  return (hashString(seed) % steps) - maxDeg;
}
