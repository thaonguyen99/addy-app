/**
 * Shared shape/shadow language for the Y2K sticker rebrand: every
 * card/button/badge uses the same recipe — thick ink outline, a flat
 * (never blurred) offset shadow, and generous border radius.
 */

import { BrandColors } from "@/constants/theme";

export const StickerRadius = {
  chip: 12,
  button: 16,
  card: 18,
  nav: 16,
  pill: 9999,
};

export const StickerBorderWidth = {
  thin: 2.5,
  standard: 3,
  thick: 4,
};

/** Flat hard-shadow offset (both x and y), in px. */
export const STICKER_SHADOW_OFFSET = 3;

/** Darkens a `#rrggbb` hex color by `amount` (0-1, fraction toward black). */
export function darkenHex(hex: string, amount: number): string {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  const scale = 1 - amount;
  const toHex = (channel: number) =>
    Math.round(channel * scale)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// The supplied palette only gives an explicit gradient partner for
// `primary` (→ `primaryLight`). Cyan/pink "deep" variants are needed for
// ChunkyNavIcon and camera-screen gradients but weren't specified — derive
// them deterministically instead of guessing hexes by eye. Ratios are a
// starting point, easy to retune visually.
export const accentCyanDeep = darkenHex(BrandColors.accentCyan, 0.15);
export const accentPinkDeep = darkenHex(BrandColors.accentPink, 0.12);
