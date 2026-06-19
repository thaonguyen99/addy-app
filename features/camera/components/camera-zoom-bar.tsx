import { Ionicons } from "@expo/vector-icons";
import { memo, useCallback, useMemo, useRef } from "react";
import {
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BrandColors } from "@/constants/theme";
import { normalizedZoomToDisplayLabel } from "@/features/camera/utils/zoom-display";
import { sharedInteractionStyles } from "@/features/camera/styles/shared-styles";

export type CameraZoomBarProps = Readonly<{
  zoom: number;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onZoomSet: (normalizedZoom: number) => void;
}>;

function CameraZoomBarInner({
  zoom,
  onZoomOut,
  onZoomIn,
  onZoomSet,
}: CameraZoomBarProps) {
  const atMin = zoom <= 0.001;
  const atMax = zoom >= 0.999;
  const trackWidthRef = useRef(0);

  const setFromLocalX = useCallback(
    (x: number) => {
      const w = trackWidthRef.current;
      if (w <= 0) return;
      onZoomSet(Math.min(1, Math.max(0, x / w)));
    },
    [onZoomSet]
  );

  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    trackWidthRef.current = e.nativeEvent.layout.width;
  }, []);

  const trackPan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          setFromLocalX(evt.nativeEvent.locationX);
        },
        onPanResponderMove: (evt) => {
          setFromLocalX(evt.nativeEvent.locationX);
        },
      }),
    [setFromLocalX]
  );

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Zoom out"
        disabled={atMin}
        hitSlop={10}
        onPress={onZoomOut}
        style={({ pressed }) => [
          styles.sideBtn,
          atMin && styles.sideBtnDisabled,
          pressed && !atMin && sharedInteractionStyles.pressedMedium,
        ]}
      >
        <Ionicons
          name="remove"
          size={16}
          color={atMin ? BrandColors.gray600 : BrandColors.white}
        />
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.scaleText}>{normalizedZoomToDisplayLabel(zoom)}</Text>
        <View
          style={styles.trackHit}
          onLayout={onTrackLayout}
          {...trackPan.panHandlers}
          accessibilityRole="adjustable"
          accessibilityLabel="Zoom level"
          accessibilityValue={{
            text: normalizedZoomToDisplayLabel(zoom),
          }}
        >
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${Math.round(zoom * 100)}%` }]} />
          </View>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Zoom in"
        disabled={atMax}
        hitSlop={10}
        onPress={onZoomIn}
        style={({ pressed }) => [
          styles.sideBtn,
          atMax && styles.sideBtnDisabled,
          pressed && !atMax && sharedInteractionStyles.pressedMedium,
        ]}
      >
        <Ionicons
          name="add"
          size={16}
          color={atMax ? BrandColors.gray600 : BrandColors.white}
        />
      </Pressable>
    </View>
  );
}

export const CameraZoomBar = memo(CameraZoomBarInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 14,
    paddingHorizontal: 8,
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
  },
  sideBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BrandColors.gray800,
    borderWidth: 1,
    borderColor: BrandColors.gray700,
    alignItems: "center",
    justifyContent: "center",
  },
  sideBtnDisabled: {
    opacity: 0.55,
  },
  center: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    gap: 4,
  },
  scaleText: {
    fontSize: 12,
    fontFamily: "BeVietnam-SemiBold",
    color: BrandColors.white,
    letterSpacing: 0.2,
  },
  trackHit: {
    width: "100%",
    paddingVertical: 10,
    justifyContent: "center",
  },
  track: {
    height: 4,
    width: "100%",
    borderRadius: 2,
    backgroundColor: BrandColors.gray700,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: BrandColors.primaryPink,
  },
});
