import type { CameraType } from "expo-camera";
import { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { AddyColors, AddyFonts } from "@/constants/theme";

/** Normalized expo-camera zoom (0–1) for a display factor; matches the pinch
 *  mapping in addy-camera-view (display = 1 + 4 × zoom). */
const zoomForFactor = (factor: number) => (factor - 1) / 4;

const ULTRA_WIDE = /ultra wide/i;
const WIDE = "Back Camera";

type CameraZoomChipsProps = Readonly<{
  facing: CameraType;
  zoom: number;
  onZoomSet: (normalizedZoom: number) => void;
  availableLenses: readonly string[];
  selectedLens: string | undefined;
  onSelectLens: (lens: string | undefined) => void;
}>;

type Chip = { key: string; label: string; active: boolean; onPress: () => void };

/**
 * `.5 · 1× · 2` zoom chips. ".5" only appears when the device reports an
 * ultra-wide back lens (iOS); the rest is digital zoom.
 */
function CameraZoomChipsInner({
  facing,
  zoom,
  onZoomSet,
  availableLenses,
  selectedLens,
  onSelectLens,
}: CameraZoomChipsProps) {
  const ultraWide =
    Platform.OS === "ios" && facing === "back"
      ? availableLenses.find((lens) => ULTRA_WIDE.test(lens))
      : undefined;
  const wide = availableLenses.includes(WIDE) ? WIDE : undefined;
  const onUltraWide = ultraWide !== undefined && selectedLens === ultraWide;

  const selectWide = (normalizedZoom: number) => {
    if (onUltraWide) onSelectLens(wide);
    onZoomSet(normalizedZoom);
  };

  const chips: Chip[] = [];
  if (ultraWide) {
    chips.push({
      key: "0.5",
      label: ".5",
      active: onUltraWide,
      onPress: () => {
        onSelectLens(ultraWide);
        onZoomSet(0);
      },
    });
  }
  chips.push(
    {
      key: "1",
      label: "1",
      active: !onUltraWide && Math.abs(zoom - zoomForFactor(1)) < 0.02,
      onPress: () => selectWide(zoomForFactor(1)),
    },
    {
      key: "2",
      label: "2",
      active: !onUltraWide && Math.abs(zoom - zoomForFactor(2)) < 0.02,
      onPress: () => selectWide(zoomForFactor(2)),
    },
  );

  return (
    <View style={styles.row}>
      {chips.map((chip) => (
        <Pressable
          key={chip.key}
          onPress={chip.onPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Zoom ${chip.label}x`}
          accessibilityState={{ selected: chip.active }}
          style={[styles.chip, chip.active && styles.chipActive]}
        >
          <Text style={[styles.label, chip.active && styles.labelActive]}>
            {chip.active ? `${chip.label}×` : chip.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export const CameraZoomChips = memo(CameraZoomChipsInner);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  chip: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: { backgroundColor: AddyColors.lime },
  label: {
    fontFamily: AddyFonts.tech,
    fontSize: 18,
    color: AddyColors.white,
  },
  labelActive: { color: AddyColors.ink },
});
