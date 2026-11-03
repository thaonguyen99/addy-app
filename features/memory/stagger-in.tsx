import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

/** When the memory chat started opening (ms), if it opened with the zoom. */
export const ChatEntranceContext = createContext<number | null>(null);

const FIRST_DELAY_MS = 200;
const STEP_MS = 70;
/** Rows past this pop in together, so a long thread doesn't keep trickling. */
const MAX_INDEX = 8;
/** Rows mounting later than this (new messages, scrolling) just appear. */
const ENTRANCE_WINDOW_MS = 1200;

/**
 * Pops a chat row in after the zoom lands: fade, rise 10px and grow from
 * 0.96, each row ~70ms after the one above. A no-op outside the zoom.
 */
export function StaggerIn({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  const openedAt = useContext(ChatEntranceContext);
  const reducedMotion = useReducedMotion();
  // Decided once on mount, so a re-render can't replay it.
  const [delay] = useState(() => {
    if (openedAt == null || reducedMotion) return null;
    const elapsed = Date.now() - openedAt;
    if (elapsed > ENTRANCE_WINDOW_MS) return null;
    const slot = FIRST_DELAY_MS + Math.min(index, MAX_INDEX) * STEP_MS;
    return Math.max(0, slot - elapsed);
  });
  const shown = useSharedValue(delay == null ? 1 : 0);

  useEffect(() => {
    if (delay == null) return;
    shown.value = withDelay(
      delay,
      withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }),
    );
  }, [delay, shown]);

  const style = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [
      { translateY: 10 * (1 - shown.value) },
      { scale: 0.96 + 0.04 * shown.value },
    ],
  }));

  if (delay == null) return children;
  return <Animated.View style={style}>{children}</Animated.View>;
}
