import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { GlossyButton } from "@/components/ui/glossy-button";
import { AddyColors, AddyFonts, AddyShadow } from "@/constants/theme";

/** Nothing in the 🔔 list: nudge toward the thing that fills it, friends. */
export function NotificationsEmpty() {
  return (
    <View style={styles.wrap}>
      <View style={[styles.orb, AddyShadow.soft]}>
        <Text style={styles.orbEmoji}>🛎️</Text>
        <Text style={styles.sparkle}>✦</Text>
      </View>
      <Text style={styles.title}>All caught up</Text>
      <Text style={styles.copy}>
        Tags, messages in your memories and friend requests land here. On this
        day memories too.
      </Text>
      <GlossyButton
        label="💌 Invite a friend"
        style={styles.cta}
        onPress={() => router.navigate("/(app)/(tabs)/friends?tab=invite")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingTop: 64, paddingHorizontal: 32 },
  orb: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3F4FF",
    transform: [{ rotate: "-6deg" }],
  },
  orbEmoji: { fontSize: 46 },
  sparkle: {
    position: "absolute",
    top: -2,
    right: 4,
    fontSize: 20,
    color: AddyColors.pink,
  },
  title: {
    marginTop: 14,
    fontFamily: AddyFonts.title,
    fontSize: 24,
    lineHeight: 34,
    color: AddyColors.ink,
  },
  copy: {
    marginTop: 2,
    maxWidth: 250,
    textAlign: "center",
    fontFamily: AddyFonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: AddyColors.inkMuted,
  },
  cta: { marginTop: 18, alignSelf: "stretch" },
});
