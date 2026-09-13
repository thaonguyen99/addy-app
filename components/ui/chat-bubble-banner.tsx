import { ReactNode, useEffect } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { StickerCard } from "@/components/ui/sticker-card";

type ChatBubbleBannerProps = {
  visible: boolean;
  onPress?: () => void;
  children?: ReactNode;
};

/**
 * Generic slide-in-from-top banner, styled as an incoming chat bubble.
 * Shared by the pin-saved success toast and the friend-pin-nearby banner.
 */
export function ChatBubbleBanner({ visible, onPress, children }: ChatBubbleBannerProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = visible
      ? withSpring(1, { damping: 14, stiffness: 180 })
      : withTiming(0, { duration: 200 });
  }, [visible, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * -40 }],
  }));

  return (
    <Animated.View
      pointerEvents={visible ? "box-none" : "none"}
      style={[styles.wrapper, animatedStyle]}
    >
      <Pressable onPress={onPress} disabled={!onPress}>
        <StickerCard>{children}</StickerCard>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 12,
    left: 16,
    right: 16,
    zIndex: 20,
  },
});
