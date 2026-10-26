import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { type Href, router } from "expo-router";
import { type ReactNode, useMemo } from "react";
import { Dimensions, Platform, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, useSharedValue } from "react-native-reanimated";

import { SWIPE_ORDER, tapHaptic } from "./floating-tab-bar";

const ACTIVE_OFFSET = 24;
const FAIL_OFFSET_Y = 14;
const MIN_DISTANCE = 70;
const MIN_VELOCITY = 600;
/** On the map, only a swipe starting this close to a screen edge counts. */
const EDGE_ZONE = 28;

type TabSwipeProps = {
  /** A tab route name, or "capture" for the camera. */
  routeName: string;
  /** The map pans sideways, so only edge swipes switch tabs there. */
  edgeOnly?: boolean;
  /** Pause swiping, e.g. while the camera is taking a photo. */
  disabled?: boolean;
  children: ReactNode;
};

/**
 * Full-width slide between tabs, pager style: the old tab moves out as the
 * new one pushes in from the side you swiped toward. A clamped spring (the
 * iOS stack's own curve) settles softly instead of the default 150ms snap.
 */
export const TAB_SLIDE: Pick<
  BottomTabNavigationOptions,
  "transitionSpec" | "sceneStyleInterpolator"
> = {
  transitionSpec: {
    animation: "spring",
    config: {
      stiffness: 1000,
      damping: 500,
      mass: 3,
      overshootClamping: true,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 0.01,
    },
  },
  sceneStyleInterpolator: ({ current }) => {
    const width = Dimensions.get("window").width;
    return {
      sceneStyle: {
        transform: [
          {
            translateX: current.progress.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [-width, 0, width],
            }),
          },
        ],
      },
    };
  },
};

const SWIPE_HREFS: Record<string, Href> = {
  lane: "/(app)/(tabs)/lane",
  explore: "/(app)/(tabs)/explore",
  capture: "/capture",
  friends: "/(app)/(tabs)/friends",
  index: "/(app)/(tabs)",
};

/**
 * Flick sideways to move through the tab bar in order: Lane · Map · camera ·
 * Friends · You. Leaving the camera pops it back to the tabs.
 */
export function TabSwipe({
  routeName,
  edgeOnly = false,
  disabled = false,
  children,
}: TabSwipeProps) {
  // Where an edge swipe started; worklet closures can't hold mutable lets.
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const gesture = useMemo(() => {
    // Android's Back gesture owns the screen edges, so the map gets none.
    const enabled = !disabled && !(edgeOnly && Platform.OS === "android");

    // dir -1: finger moved right → the slot on the left.
    const go = (dir: -1 | 1) => {
      const target = SWIPE_ORDER[SWIPE_ORDER.indexOf(routeName) + dir];
      if (!target) return;
      tapHaptic();
      // From a tab, the camera is pushed on top, as the orb does. Any other
      // target is a tab; navigating there from the camera pops it.
      if (target === "capture") router.push(SWIPE_HREFS[target]);
      else router.navigate(SWIPE_HREFS[target]);
    };

    const pan = Gesture.Pan()
      .enabled(enabled)
      // Two fingers is the camera's pinch-to-zoom, not a swipe.
      .maxPointers(1)
      .activeOffsetX([-ACTIVE_OFFSET, ACTIVE_OFFSET])
      .failOffsetY([-FAIL_OFFSET_Y, FAIL_OFFSET_Y])
      .onEnd((e) => {
        const flicked =
          Math.abs(e.translationX) > MIN_DISTANCE ||
          Math.abs(e.velocityX) > MIN_VELOCITY;
        if (flicked) runOnJS(go)(e.translationX > 0 ? -1 : 1);
      });

    if (edgeOnly) {
      const width = Dimensions.get("window").width;
      // Attached after the chain, so the Babel plugin doesn't workletize
      // these on its own; mark them so every callback runs on the UI thread.
      pan.manualActivation(true);
      pan
        .onTouchesDown((e, state) => {
          "worklet";
          const touch = e.changedTouches[0];
          if (
            !touch ||
            (touch.absoluteX > EDGE_ZONE &&
              touch.absoluteX < width - EDGE_ZONE)
          ) {
            state.fail();
            return;
          }
          startX.value = touch.absoluteX;
          startY.value = touch.absoluteY;
        })
        .onTouchesMove((e, state) => {
          "worklet";
          const touch = e.changedTouches[0];
          if (!touch) return;
          if (Math.abs(touch.absoluteY - startY.value) > FAIL_OFFSET_Y) state.fail();
          else if (Math.abs(touch.absoluteX - startX.value) > ACTIVE_OFFSET) {
            state.activate();
          }
        });
    }
    return pan;
  }, [routeName, edgeOnly, disabled, startX, startY]);

  // The screen's own root may be flattened away; give the detector a real view.
  return (
    <GestureDetector gesture={gesture}>
      <View collapsable={false} style={styles.fill}>
        {children}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
