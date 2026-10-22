import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const FLASH_MS = 500;

/** One-shot white camera-style flash over the whole screen. */
export function RevealFlash() {
  const reducedMotion = useReducedMotion();
  const [play] = useState(() => !reducedMotion);
  const opacity = useSharedValue(play ? 1 : 0);

  useEffect(() => {
    if (!play) return;
    opacity.value = withTiming(0, {
      duration: FLASH_MS,
      easing: Easing.in(Easing.quad),
    });
  }, [play, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (!play) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.flash, style]}
    />
  );
}

const styles = StyleSheet.create({
  flash: { backgroundColor: "#FFFFFF" },
});
