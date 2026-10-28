import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SkyBackground } from "@/components/ui/sky-background";
import { TechChip } from "@/components/ui/tech-chip";
import { AddyColors, AddyFonts } from "@/constants/theme";
import { NotificationBell } from "@/features/notifications/notification-bell";

/** Placeholder until the Memory Lane feed is designed; the 🔔 lives here already. */
export default function MemoryLaneScreen() {
  return (
    <SkyBackground>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            Memory Lane
          </Text>
          <NotificationBell />
        </View>
        <View style={styles.center}>
          <Text style={styles.emoji}>🎞️</Text>
          <Text style={styles.title}>Memory Lane is coming soon</Text>
          <TechChip label="under construction" leading="✦" size="sm" />
        </View>
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 6,
  },
  headerTitle: {
    fontFamily: AddyFonts.title,
    fontSize: 26,
    lineHeight: 36,
    color: AddyColors.ink,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 32,
  },
  emoji: { fontSize: 44 },
  title: {
    fontFamily: AddyFonts.title,
    fontSize: 22,
    lineHeight: 34,
    color: AddyColors.ink,
    textAlign: "center",
  },
});
