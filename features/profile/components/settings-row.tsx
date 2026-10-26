import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";

/** Glossy tile colors: top highlight → body, plus a slightly deeper edge. */
export const SETTINGS_TILES = {
  cyan: { colors: ["#D3F0FF", "#7FD3FF"] as const, edge: "#5FB6E6" },
  pink: { colors: ["#FFD0E8", "#FF86C4"] as const, edge: "#E9649F" },
  lime: { colors: ["#F2FFC2", "#C7F23A"] as const, edge: "#A6D62A" },
  yellow: { colors: ["#FFF3B8", "#FFDD4A"] as const, edge: "#E5BF2A" },
};

export type SettingsTileTone = keyof typeof SETTINGS_TILES;

const TILE = 44;

/** Rounded-square glossy icon tile with an emoji. */
export function SettingsTile({
  emoji,
  tone,
}: {
  emoji: string;
  tone: SettingsTileTone;
}) {
  const tile = SETTINGS_TILES[tone];
  return (
    <LinearGradient
      colors={tile.colors}
      style={[styles.tile, { borderColor: tile.edge }]}
    >
      <View style={styles.tileShine} />
      <Text style={styles.tileEmoji}>{emoji}</Text>
    </LinearGradient>
  );
}

/** One Settings row as its own card: tile · label + sublabel · chevron. */
export function SettingsRow({
  emoji,
  tone,
  label,
  sublabel,
  onPress,
  right,
}: {
  emoji: string;
  tone: SettingsTileTone;
  label: string;
  sublabel?: string;
  onPress: () => void;
  right?: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={sublabel ? `${label}, ${sublabel}` : label}
      style={({ pressed }) => [
        styles.row,
        AddyShadow.soft,
        pressed && styles.pressed,
      ]}
    >
      <SettingsTile emoji={emoji} tone={tone} />
      <View style={styles.text}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {sublabel ? (
          <Text style={styles.sublabel} numberOfLines={1}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      {right ?? <Text style={styles.chevron}>›</Text>}
    </Pressable>
  );
}

/** "Account", "From friends"… */
export function SettingsSectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 72,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: AddyRadius.card,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.paper,
  },
  pressed: { opacity: 0.8 },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 12,
    borderWidth: ADDY_BORDER_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  // Glossy highlight across the top, same light direction as GlossyOrb.
  tileShine: {
    position: "absolute",
    top: 2,
    left: 4,
    right: 4,
    height: TILE * 0.38,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
  },
  tileEmoji: { fontSize: 20 },
  text: { flex: 1, gap: 0 },
  label: {
    fontFamily: AddyFonts.title,
    fontSize: 17,
    lineHeight: 24,
    color: AddyColors.ink,
  },
  sublabel: {
    fontFamily: AddyFonts.tech,
    fontSize: 16,
    lineHeight: 18,
    color: AddyColors.inkMuted,
  },
  chevron: {
    fontFamily: AddyFonts.tech,
    fontSize: 24,
    color: AddyColors.inkMuted,
  },
  sectionTitle: {
    fontFamily: AddyFonts.title,
    fontSize: 17,
    lineHeight: 24,
    color: AddyColors.ink,
    marginTop: 8,
    marginLeft: 4,
  },
});
