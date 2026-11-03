import { usePreventRemove } from "@react-navigation/native";
import { router, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { MemoryDetailScreen } from "@/features/memory/memory-detail-screen";
import { ChatEntranceContext } from "@/features/memory/stagger-in";
import {
  type CardRect,
  findCardRect,
  laneZoomProgress,
} from "./zoom-transition";

const CARD_RADIUS = 16;
const OPEN_SPRING = { duration: 400, dampingRatio: 0.78 };
const CLOSE_MS = 260;
const CLOSE_EASING = Easing.out(Easing.cubic);
/** On close, the chat fades out over the last stretch into the card, so the
 *  real card is already showing through when the chat goes away. */
const CLOSE_FADE_FROM = 0.35;
const FADE_MS = 200;
/** A swipe starting this close to the left edge closes the chat. */
const EDGE_WIDTH = 28;

type Mode = "zoom" | "fade";

type MemoryZoomScreenProps = {
  id: string;
  /** The tapped card, in window coordinates; null opens with a fade. */
  from: CardRect | null;
};

/**
 * The memory chat zooming out of its Lane card, macOS style: the card's
 * rect grows to full screen (corners squaring off) over a dimmed, shrunken
 * feed, then shrinks back into the card on close — or fades out when that
 * card has scrolled away.
 */
export function MemoryZoomScreen({ id, from }: MemoryZoomScreenProps) {
  const navigation = useNavigation();
  const window = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [openedAt] = useState(() => Date.now());

  // Zoom between the card rect (progress 0) and full screen (1); "fade" mode
  // ignores the rect and animates opacity/scale instead.
  const [initialMode] = useState<Mode>(() =>
    from && !reducedMotion ? "zoom" : "fade",
  );
  const fadeMode = useSharedValue(initialMode === "fade" ? 1 : 0);
  const progress = useSharedValue(0);
  const fade = useSharedValue(0);
  const fadeScale = useSharedValue(reducedMotion ? 1 : 0.96);
  const rectX = useSharedValue(from?.x ?? 0);
  const rectY = useSharedValue(from?.y ?? 0);
  const rectW = useSharedValue(from?.width ?? window.width);
  const rectH = useSharedValue(from?.height ?? window.height);
  const closingZoom = useSharedValue(0);

  // While zooming, Lane's shrink and dim follow the zoom itself, so both
  // land on the same frame (clamped: the open spring overshoots past 1).
  useAnimatedReaction(
    () => (fadeMode.value === 0 ? Math.min(1, Math.max(0, progress.value)) : -1),
    (p) => {
      if (p >= 0) laneZoomProgress.value = p;
    },
  );

  useEffect(() => {
    if (initialMode === "zoom") {
      progress.value = withSpring(1, OPEN_SPRING);
    } else {
      fade.value = withTiming(1, { duration: FADE_MS });
      fadeScale.value = withTiming(1, { duration: FADE_MS });
      laneZoomProgress.value = withTiming(1, { duration: FADE_MS });
    }
  }, [initialMode, progress, fade, fadeScale]);

  // Back button, swipe and hardware back all remove the screen: hold the
  // removal until the close animation has played.
  const [closed, setClosed] = useState(false);
  const closing = useRef(false);
  const pendingAction = useRef<
    Parameters<typeof navigation.dispatch>[0] | null
  >(null);

  usePreventRemove(!closed, ({ data }) => {
    if (closing.current) return;
    closing.current = true;
    pendingAction.current = data.action;
    const done = () => setClosed(true);

    void findCardRect(id, window).then((rect) => {
      if (rect && !reducedMotion) {
        rectX.value = rect.x;
        rectY.value = rect.y;
        rectW.value = rect.width;
        rectH.value = rect.height;
        if (fadeMode.value === 1) {
          // Opened without a rect: switch to the zoom at full screen.
          progress.value = 1;
          fadeMode.value = 0;
        }
        closingZoom.value = 1;
        progress.value = withTiming(
          0,
          { duration: CLOSE_MS, easing: CLOSE_EASING },
          (finished) => {
            if (finished) runOnJS(done)();
          },
        );
        return;
      }
      // The card is gone or off screen (or reduced motion): fade away.
      laneZoomProgress.value = withTiming(0, { duration: CLOSE_MS });
      if (fadeMode.value === 0) {
        fade.value = 1;
        fadeScale.value = 1;
        fadeMode.value = 1;
      }
      if (!reducedMotion) {
        fadeScale.value = withTiming(0.9, { duration: CLOSE_MS });
      }
      fade.value = withTiming(0, { duration: CLOSE_MS }, (finished) => {
        if (finished) runOnJS(done)();
      });
    });
  });

  useEffect(() => {
    if (closed && pendingAction.current) {
      navigation.dispatch(pendingAction.current);
    }
  }, [closed, navigation]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, []);

  const edgeSwipe = Gesture.Pan()
    .hitSlop({ left: 0, width: EDGE_WIDTH })
    .activeOffsetX(20)
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      if (e.translationX > 80 || e.velocityX > 600) runOnJS(goBack)();
    });

  const { width: W, height: H } = window;

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * laneZoomProgress.value,
  }));

  const containerStyle = useAnimatedStyle(() => {
    if (fadeMode.value === 1) {
      return {
        left: 0,
        top: 0,
        width: W,
        height: H,
        borderRadius: 0,
        opacity: fade.value,
        transform: [{ scale: fadeScale.value }],
      };
    }
    const p = progress.value;
    return {
      left: rectX.value * (1 - p),
      top: rectY.value * (1 - p),
      width: rectW.value + (W - rectW.value) * p,
      height: rectH.value + (H - rectH.value) * p,
      borderRadius: Math.max(0, CARD_RADIUS * (1 - p)),
      opacity:
        closingZoom.value === 1
          ? interpolate(p, [0, CLOSE_FADE_FROM], [0, 1], "clamp")
          : 1,
      transform: [{ scale: 1 }],
    };
  });

  // The chat lays out at full screen size and scales with the container's
  // width, so nothing reflows mid-zoom; the container clips the rest.
  const contentStyle = useAnimatedStyle(() => {
    if (fadeMode.value === 1) return { transform: [{ scale: 1 }] };
    const width = rectW.value + (W - rectW.value) * progress.value;
    return { transform: [{ scale: width / W }] };
  });

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        pointerEvents="none"
      />
      <GestureDetector gesture={edgeSwipe}>
        <Animated.View style={[styles.container, containerStyle]}>
          <Animated.View
            style={[{ width: W, height: H }, styles.content, contentStyle]}
          >
            <ChatEntranceContext.Provider value={openedAt}>
              <MemoryDetailScreen id={id} />
            </ChatEntranceContext.Provider>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "#000" },
  container: { position: "absolute", overflow: "hidden" },
  content: { transformOrigin: "top left" },
});
