import { forwardRef, useCallback, useImperativeHandle } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { BrandColors } from "@/constants/theme";

export type CameraShutterFlashRef = {
  play: () => void;
};

const FLASH_IN_MS = 70;
const FLASH_OUT_MS = 260;
/** Peak opacity — soft, not a harsh full-white blast. */
const FLASH_PEAK_OPACITY = 0.52;

export const CameraShutterFlash = forwardRef<CameraShutterFlashRef>(
  function CameraShutterFlash(_props, ref) {
    const opacity = useSharedValue(0);

    const play = useCallback(() => {
      opacity.value = withSequence(
        withTiming(FLASH_PEAK_OPACITY, { duration: FLASH_IN_MS }),
        withTiming(0, { duration: FLASH_OUT_MS }),
      );
    }, [opacity]);

    useImperativeHandle(ref, () => ({ play }), [play]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    return (
      <Animated.View
        pointerEvents="none"
        style={[styles.flash, animatedStyle]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  },
);

const styles = StyleSheet.create({
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BrandColors.white,
  },
});
