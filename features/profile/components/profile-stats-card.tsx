import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
  BrandColors,
} from "@/constants/theme";
import { ProfileMuted } from "@/features/profile/components/profile-header";

type Stats = { memories: number; places: number; friends: number };

/**
 * memories · places · friends in one card. `null` stats show "–" (loading,
 * blocked, not found). `onPressFriends` turns the last cell into "friends ›".
 */
export function ProfileStatsCard({
  stats,
  onPressFriends,
  muted = false,
}: {
  stats: Stats | null;
  onPressFriends?: () => void;
  muted?: boolean;
}) {
  const value = (n: number | undefined) => (n === undefined ? "–" : String(n));
  return (
    <View style={[styles.card, AddyShadow.soft, muted && styles.cardMuted]}>
      <Cell value={value(stats?.memories)} label="memories" muted={muted} />
      <View style={styles.divider} />
      <Cell value={value(stats?.places)} label="places" muted={muted} />
      <View style={styles.divider} />
      <Cell
        value={value(stats?.friends)}
        label="friends"
        muted={muted}
        onPress={onPressFriends}
      />
    </View>
  );
}

function Cell({
  value,
  label,
  muted,
  onPress,
}: {
  value: string;
  label: string;
  muted: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityLabel={`${value === "–" ? "no" : value} ${label}`}
      style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
    >
      <Text style={[styles.value, muted && { color: ProfileMuted.text }]}>
        {value}
      </Text>
      <Text
        style={[
          styles.label,
          onPress && styles.link,
          muted && { color: ProfileMuted.subtle },
        ]}
        numberOfLines={1}
      >
        {onPress ? `${label} ›` : label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    borderRadius: AddyRadius.card,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
    overflow: "hidden",
  },
  cardMuted: { backgroundColor: "rgba(255, 255, 255, 0.7)" },
  divider: { width: ADDY_BORDER_WIDTH, backgroundColor: AddyColors.line },
  cell: { flex: 1, alignItems: "center", paddingVertical: 8 },
  value: {
    fontFamily: AddyFonts.title,
    fontSize: 22,
    lineHeight: 30,
    color: AddyColors.ink,
  },
  label: { fontFamily: AddyFonts.tech, fontSize: 18, color: AddyColors.inkMuted },
  link: { color: BrandColors.link },
  pressed: { opacity: 0.7 },
});
