import type { ViewStyle } from "react-native";

import { BrandColors } from "@/constants/theme";

/**
 * Shared polaroid look — a light paper frame with an even border and a heavier
 * bottom (the caption lip), lifted off the background by a soft shadow. Used by
 * the memory feed card and the map marker so both read as the same object.
 */
export const POLAROID = {
  frameColor: BrandColors.paper,
  radius: 3,
  borderTop: 8,
  borderSide: 8,
  borderBottom: 20,
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  } satisfies ViewStyle,
} as const;

/**
 * A small, stable tilt for a card, derived from its id so it never changes
 * between renders / re-sorts (Math.random would fight React.memo). Range −2°…+2°.
 */
export function rotationForId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  const steps = Math.abs(hash) % 9; // 0..8
  const deg = steps / 2 - 2; // -2, -1.5, ... 2
  return `${deg}deg`;
}
