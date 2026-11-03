import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { ADDY_BORDER_WIDTH, AddyColors, AddyShadow } from "@/constants/theme";
import { FEED_CARD_RADIUS } from "./feed-card";

/** Card-shaped placeholder while the first feed page loads. */
export function FeedCardSkeleton({ width }: { width: number }) {
  const reducedMotion = useReducedMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reducedMotion) return;
    pulse.value = withRepeat(withTiming(0.55, { duration: 700 }), -1, true);
  }, [pulse, reducedMotion]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View
      style={[styles.card, AddyShadow.soft, { width }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Animated.View style={[styles.clip, pulseStyle]}>
        <View style={styles.strip}>
          <View style={styles.avatar} />
          <View style={styles.stripText}>
            <View style={[styles.bar, { width: "55%" }]} />
            <View style={[styles.bar, styles.barThin, { width: "35%" }]} />
          </View>
        </View>
        <View
          style={[styles.photo, { height: width - ADDY_BORDER_WIDTH * 2 }]}
        />
        <View style={styles.body}>
          <View style={[styles.bar, { width: "70%" }]} />
          <View style={[styles.bar, styles.barThin, { width: "45%" }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: "center",
    borderRadius: FEED_CARD_RADIUS,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  clip: {
    borderRadius: FEED_CARD_RADIUS - ADDY_BORDER_WIDTH,
    overflow: "hidden",
  },
  strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AddyColors.paperDim,
  },
  stripText: { flex: 1, gap: 6 },
  photo: { backgroundColor: AddyColors.paperDim },
  body: { padding: 12, gap: 8 },
  bar: { height: 12, borderRadius: 6, backgroundColor: AddyColors.paperDim },
  barThin: { height: 9 },
});
