import type { View } from "react-native";
import { makeMutable } from "react-native-reanimated";

/** A view's rect in window coordinates. */
export type CardRect = { x: number; y: number; width: number; height: number };

/** How far the memory chat has zoomed out of a Lane card: 0 = closed, 1 = open.
 *  The Lane screen scales down behind it from this. */
export const laneZoomProgress = makeMutable(0);

/** Lane scales to this while a chat is zoomed over it. */
export const LANE_BEHIND_SCALE = 0.94;

export function measureView(view: View | null): Promise<CardRect | null> {
  return new Promise((resolve) => {
    if (!view) {
      resolve(null);
      return;
    }
    view.measureInWindow((x, y, width, height) =>
      resolve(width > 0 && height > 0 ? { x, y, width, height } : null),
    );
  });
}

/** Mounted Lane cards by memory id, so a closing chat can find its card again
 *  (the feed may have refetched and moved it). */
const cards = new Map<string, () => View | null>();

export function registerCard(id: string, getView: () => View | null) {
  cards.set(id, getView);
  return () => {
    if (cards.get(id) === getView) cards.delete(id);
  };
}

/**
 * Where a memory's card sits now, as it will be once Lane scales back to 1 —
 * or null when it's unmounted or off screen (the close falls back to a fade).
 */
export async function findCardRect(
  id: string,
  window: { width: number; height: number },
): Promise<CardRect | null> {
  const rect = await measureView(cards.get(id)?.() ?? null);
  if (!rect) return null;
  // Lane is scaled around the window center while the chat is open; undo it.
  const s = 1 + (LANE_BEHIND_SCALE - 1) * laneZoomProgress.value;
  const cx = window.width / 2;
  const cy = window.height / 2;
  const unscaled = {
    x: cx + (rect.x - cx) / s,
    y: cy + (rect.y - cy) / s,
    width: rect.width / s,
    height: rect.height / s,
  };
  const MIN_VISIBLE = 40;
  const visible =
    unscaled.y + unscaled.height > MIN_VISIBLE &&
    unscaled.y < window.height - MIN_VISIBLE;
  return visible ? unscaled : null;
}
