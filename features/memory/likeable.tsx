import * as Haptics from "expo-haptics";
import { memo, type ReactNode, useMemo } from "react";
import {
  type AccessibilityActionEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AddyColors, AddyFonts, AddyShadow } from "@/constants/theme";

type LikeableProps = {
  children: ReactNode;
  liked: boolean;
  /** Toggles the like — called on double-tap. */
  onToggleLike: () => void;
  onLongPress?: () => void;
  /** Single tap, e.g. retrying a failed send. */
  onTap?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Double-tap to like/unlike, long-press for the actions menu. A like gets a
 * haptic and a heart that pops over the bubble.
 */
export const Likeable = memo(function Likeable({
  children,
  liked,
  onToggleLike,
  onLongPress,
  onTap,
  style,
  accessibilityLabel,
}: LikeableProps) {
  const pop = useSharedValue(0);

  const gesture = useMemo(() => {
    const toggle = () => {
      if (!liked) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        pop.value = withSequence(
          withSpring(1, { damping: 9, stiffness: 260 }),
          withTiming(1, { duration: 220 }),
          withTiming(0, { duration: 180 }),
        );
      }
      onToggleLike();
    };
    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDelay(150)
      .onEnd((_e, success) => {
        if (success) runOnJS(toggle)();
      });
    const longPress = Gesture.LongPress()
      .minDuration(320)
      .onStart(() => {
        if (onLongPress) runOnJS(onLongPress)();
      });
    const singleTap = Gesture.Tap().onEnd((_e, success) => {
      if (success && onTap) runOnJS(onTap)();
    });
    return Gesture.Exclusive(doubleTap, longPress, singleTap);
  }, [liked, onToggleLike, onLongPress, onTap, pop]);

  const heartStyle = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ scale: 0.4 + pop.value * 0.8 }],
  }));

  // Screen readers can't double-tap a bubble — expose the like as an action.
  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === "like") onToggleLike();
    if (event.nativeEvent.actionName === "longpress") onLongPress?.();
  };

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={style}
        accessible
        accessibilityLabel={accessibilityLabel}
        accessibilityActions={[
          { name: "like", label: liked ? "Unlike" : "Like" },
          ...(onLongPress
            ? [{ name: "longpress", label: "More options" }]
            : []),
        ]}
        onAccessibilityAction={onAccessibilityAction}
      >
        {children}
        <Animated.Text
          pointerEvents="none"
          style={[styles.popHeart, heartStyle]}
        >
          ♥
        </Animated.Text>
      </View>
    </GestureDetector>
  );
});

type HeartChipProps = {
  count: number;
  liked: boolean;
  /** Bottom corner to sit on. Right everywhere today, so it never covers the
   *  left-aligned place tag or text start. */
  side: "left" | "right";
  onPress: () => void;
  accessibilityLabel: string;
};

/** Pink heart + count on a bubble's bottom corner. Hidden at 0. */
export const HeartChip = memo(function HeartChip({
  count,
  liked,
  side,
  onPress,
  accessibilityLabel,
}: HeartChipProps) {
  if (count <= 0) return null;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.chip,
        AddyShadow.soft,
        side === "left" ? styles.chipLeft : styles.chipRight,
      ]}
    >
      <Text style={[styles.chipHeart, !liked && styles.chipHeartOff]}>♥</Text>
      <Text style={styles.chipCount}>{count}</Text>
    </Pressable>
  );
});

/** Space below a bubble that shows a heart chip, so rows don't overlap. */
export const HEART_CHIP_OVERHANG = 12;

const styles = StyleSheet.create({
  popHeart: {
    position: "absolute",
    alignSelf: "center",
    top: "50%",
    marginTop: -28,
    fontSize: 48,
    lineHeight: 56,
    color: AddyColors.pink,
    textShadowColor: "rgba(255, 255, 255, 0.9)",
    textShadowRadius: 6,
  },
  chip: {
    position: "absolute",
    bottom: -HEART_CHIP_OVERHANG,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 22,
    paddingHorizontal: 7,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  chipLeft: { left: 8 },
  chipRight: { right: 8 },
  chipHeart: { fontSize: 12, color: AddyColors.pink },
  chipHeartOff: { color: AddyColors.inkMuted },
  chipCount: {
    fontFamily: AddyFonts.tech,
    fontSize: 16,
    lineHeight: 18,
    color: AddyColors.ink,
  },
});
