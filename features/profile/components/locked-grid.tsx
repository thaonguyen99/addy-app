import { StyleSheet, Text, View } from "react-native";
import Svg, { Defs, Line, Pattern, Rect } from "react-native-svg";

import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";
import { GRID_GAP, useGridTileSize } from "@/features/profile/grid-layout";

const TILES = 6;

/** Six striped placeholders with "Memories are for friends" on top. */
export function LockedGrid({ name }: { name: string }) {
  const size = useGridTileSize();

  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {Array.from({ length: TILES }, (_, i) => (
          <View key={i} style={[styles.tile, { width: size, height: size }]}>
            <Svg width="100%" height="100%">
              <Defs>
                <Pattern
                  id={`stripes-${i}`}
                  width={12}
                  height={12}
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <Line x1={0} y1={0} x2={0} y2={12} stroke="#E4E5EC" strokeWidth={5} />
                </Pattern>
              </Defs>
              <Rect width="100%" height="100%" fill={`url(#stripes-${i})`} />
            </Svg>
          </View>
        ))}
      </View>

      <View style={styles.overlay} pointerEvents="none">
        <View style={[styles.card, AddyShadow.soft]}>
          <View style={styles.sticker}>
            <Text style={styles.stickerGlyph}>🔒</Text>
          </View>
          <Text style={styles.title}>Memories are for friends</Text>
          <Text style={styles.body}>
            Become friends with {name} to see the places they share.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP },
  tile: {
    borderRadius: AddyRadius.tile,
    overflow: "hidden",
    backgroundColor: "#F2F2F5",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  card: {
    alignSelf: "stretch",
    alignItems: "center",
    gap: 2,
    paddingTop: 26,
    paddingBottom: 16,
    paddingHorizontal: 18,
    borderRadius: AddyRadius.card + 4,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.paper,
  },
  sticker: {
    position: "absolute",
    top: -22,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: AddyColors.yellow,
    transform: [{ rotate: "-6deg" }],
  },
  stickerGlyph: { fontSize: 28 },
  title: {
    fontFamily: AddyFonts.title,
    fontSize: 19,
    lineHeight: 26,
    color: AddyColors.ink,
    textAlign: "center",
  },
  body: {
    fontFamily: AddyFonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: AddyColors.inkMuted,
    textAlign: "center",
  },
});
