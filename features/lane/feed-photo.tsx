import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { memo, useCallback, useMemo, useState } from "react";
import {
  type AccessibilityActionEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AddyColors } from "@/constants/theme";
import { cloudinaryThumb } from "@/lib/cloudinary-thumb";

const HEART_SIZE = 96;
/** Pop in, hold, fade out: ~1.2s in all. */
const HEART_HOLD_MS = 650;
const HEART_FADE_MS = 280;

type FeedPhotoProps = {
  id: string;
  /** Every photo on the memory, cover first. Swipe sideways between them. */
  urls: string[];
  size: number;
  /** Double tap. Plays the heart even when already liked. */
  onLike: () => void;
  /** Single tap. */
  onTap: () => void;
  accessibilityLabel: string;
};

/**
 * Square photo pager: swipe through the memory's photos, double tap to like
 * (big pink heart pops over it), single tap to open the memory chat.
 */
export const FeedPhoto = memo(function FeedPhoto({
  id,
  urls,
  size,
  onLike,
  onTap,
  accessibilityLabel,
}: FeedPhotoProps) {
  const reducedMotion = useReducedMotion();
  const heartScale = useSharedValue(0);
  const heartOpacity = useSharedValue(0);
  const [showHeart, setShowHeart] = useState(false);
  const [page, setPage] = useState(0);

  const like = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowHeart(true);
    onLike();
  }, [onLike]);

  const gesture = useMemo(() => {
    const hideHeart = () => setShowHeart(false);

    const doubleTap = Gesture.Tap()
      .numberOfTaps(2)
      .maxDelay(250)
      .onEnd((_e, success) => {
        if (!success) return;
        heartScale.value = reducedMotion
          ? 1
          : withSequence(
              withTiming(0, { duration: 0 }),
              withSpring(1.15, { damping: 10, stiffness: 320 }),
              withSpring(1, { damping: 12, stiffness: 260 }),
            );
        heartOpacity.value = withSequence(
          withTiming(1, { duration: 120 }),
          withDelay(
            HEART_HOLD_MS,
            withTiming(0, { duration: HEART_FADE_MS }, (finished) => {
              if (finished) runOnJS(hideHeart)();
            }),
          ),
        );
        runOnJS(like)();
      });

    const singleTap = Gesture.Tap().onEnd((_e, success) => {
      if (success) runOnJS(onTap)();
    });

    return Gesture.Exclusive(doubleTap, singleTap);
  }, [heartOpacity, heartScale, like, onTap, reducedMotion]);

  const heartStyle = useAnimatedStyle(() => ({
    opacity: heartOpacity.value,
    transform: [{ scale: heartScale.value }],
  }));

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setPage(Math.round(e.nativeEvent.contentOffset.x / size));
    },
    [size],
  );

  // Screen readers can't double tap a photo — expose both as actions.
  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === "like") onLike();
    if (event.nativeEvent.actionName === "activate") onTap();
  };

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{ width: size, height: size }}
        accessible
        accessibilityRole="imagebutton"
        accessibilityLabel={
          urls.length > 1
            ? `${accessibilityLabel}, ${urls.length} photos`
            : accessibilityLabel
        }
        accessibilityHint="Opens the memory chat"
        accessibilityActions={[
          { name: "activate" },
          { name: "like", label: "Like" },
        ]}
        onAccessibilityAction={onAccessibilityAction}
      >
        <ScrollView
          horizontal
          pagingEnabled
          scrollEnabled={urls.length > 1}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onMomentumEnd}
          style={styles.pager}
        >
          {urls.map((url, i) => (
            <Image
              key={`${i}-${url}`}
              source={{ uri: cloudinaryThumb(url, size) }}
              style={{ width: size, height: size }}
              contentFit="cover"
              recyclingKey={`${id}-${i}`}
              transition={150}
            />
          ))}
        </ScrollView>
        {urls.length > 1 ? (
          <View style={styles.dots} pointerEvents="none">
            {urls.map((url, i) => (
              <View
                key={`${i}-${url}`}
                style={[styles.dot, i === page && styles.dotActive]}
              />
            ))}
          </View>
        ) : null}
        {showHeart ? (
          <View style={styles.heartLayer} pointerEvents="none">
            <Animated.View style={heartStyle}>
              <Ionicons
                name="heart"
                size={HEART_SIZE}
                color={AddyColors.pink}
                style={styles.heart}
              />
            </Animated.View>
          </View>
        ) : null}
      </View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  pager: { backgroundColor: AddyColors.paperDim },
  dots: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: "rgba(22, 23, 26, 0.35)",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },
  dotActive: { backgroundColor: AddyColors.white },
  heartLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  heart: {
    textShadowColor: "rgba(22, 23, 26, 0.3)",
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
});
