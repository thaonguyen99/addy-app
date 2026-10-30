import { StyleSheet, View } from "react-native";

import { AddyColors } from "@/constants/theme";

/** Corner radius of the square viewfinder (quick snap, photo picker). */
export const VIEWFINDER_RADIUS = 18;
const BRACKET = 22;

/** Rule-of-thirds grid and corner brackets over a square viewfinder. */
export function ViewfinderOverlay() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.gridLine, styles.gridV, { left: "33.333%" }]} />
      <View style={[styles.gridLine, styles.gridV, { left: "66.666%" }]} />
      <View style={[styles.gridLine, styles.gridH, { top: "33.333%" }]} />
      <View style={[styles.gridLine, styles.gridH, { top: "66.666%" }]} />
      <View style={[styles.bracket, styles.bracketTL]} />
      <View style={[styles.bracket, styles.bracketTR]} />
      <View style={[styles.bracket, styles.bracketBL]} />
      <View style={[styles.bracket, styles.bracketBR]} />
    </View>
  );
}

const styles = StyleSheet.create({
  gridLine: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  gridV: { top: 0, bottom: 0, width: StyleSheet.hairlineWidth },
  gridH: { left: 0, right: 0, height: StyleSheet.hairlineWidth },
  bracket: {
    position: "absolute",
    width: BRACKET,
    height: BRACKET,
    borderColor: AddyColors.white,
  },
  bracketTL: {
    top: 12,
    left: 12,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderTopLeftRadius: 8,
  },
  bracketTR: {
    top: 12,
    right: 12,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopRightRadius: 8,
  },
  bracketBL: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderBottomLeftRadius: 8,
  },
  bracketBR: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderBottomRightRadius: 8,
  },
});
