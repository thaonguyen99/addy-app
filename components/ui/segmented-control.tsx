import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import {
  type LayoutChangeEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";

const PADDING = 3;
const GAP = 3;
const SPRING = { damping: 18, stiffness: 220, mass: 0.8 };

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
};

/** Pill track with a cyan thumb that slides to the "on" segment. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const [trackWidth, setTrackWidth] = useState(0);
  const count = options.length;
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  // onLayout reports the outer width; the thumb lives inside border + padding.
  const segmentWidth =
    trackWidth > 0
      ? (trackWidth - ADDY_BORDER_WIDTH * 2 - PADDING * 2 - GAP * (count - 1)) /
        count
      : 0;
  const target = index * (segmentWidth + GAP);

  const x = useSharedValue(0);
  const placedRef = useRef(false);

  useEffect(() => {
    if (segmentWidth <= 0) return;
    if (!placedRef.current) {
      // First layout: jump into place instead of sliding in from the left.
      placedRef.current = true;
      x.value = target;
      return;
    }
    x.value = withSpring(target, SPRING);
  }, [target, segmentWidth, x]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  return (
    <View
      style={[styles.track, style]}
      onLayout={onLayout}
      accessibilityRole="tablist"
    >
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.thumb,
            AddyShadow.soft,
            { width: segmentWidth },
            thumbStyle,
          ]}
        />
      ) : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              if (selected) return;
              void Haptics.selectionAsync();
              onChange(option.value);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={styles.segment}
          >
            <Text
              style={[styles.label, selected && styles.labelOn]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: PADDING,
    gap: GAP,
    borderRadius: AddyRadius.pill,
    backgroundColor: AddyColors.paperDim,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
  },
  // Absolute children sit inside the border, so PADDING lines it up with
  // the first segment.
  thumb: {
    position: "absolute",
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: AddyRadius.pill,
    backgroundColor: AddyColors.cyan,
  },
  segment: {
    flex: 1,
    minHeight: 38,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: AddyRadius.pill,
  },
  label: {
    fontFamily: AddyFonts.bodySemiBold,
    fontSize: 13,
    color: AddyColors.inkMuted,
  },
  labelOn: { color: AddyColors.ink },
});
