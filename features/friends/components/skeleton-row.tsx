import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { ADDY_BORDER_WIDTH, AddyColors, AddyRadius } from "@/constants/theme";

/** Placeholder person row while the lists load. */
export function SkeletonRow() {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(withTiming(0.5, { duration: 700 }), -1, true);
  }, [opacity, reduceMotion]);

  const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.row, pulse]}>
      <View style={styles.avatar} />
      <View style={styles.lines}>
        <View style={[styles.line, { width: "45%" }]} />
        <View style={[styles.line, styles.lineThin, { width: "70%" }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 68,
    paddingHorizontal: 12,
    marginBottom: 10,
    borderRadius: AddyRadius.card,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: AddyColors.paperDim,
  },
  lines: { flex: 1, gap: 8 },
  line: { height: 12, borderRadius: 6, backgroundColor: AddyColors.paperDim },
  lineThin: { height: 9 },
});
