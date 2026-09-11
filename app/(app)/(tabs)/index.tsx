import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TourTarget } from "@wrack/react-native-tour-guide";

import { ThemedText } from "@/components/ui/themed-text";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { ONBOARDING_ADD_FRIEND_TARGET_ID } from "@/features/onboarding/onboarding-tour";
import { useStatsQuery } from "@/lib/query/hooks";
import { BrandColors } from "@/constants/theme";

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading } = useStatsQuery();

  const name =
    user?.name || user?.username || user?.email?.split("@")[0] || "";

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <ThemedText type="title" style={styles.title}>
            Hi{name ? `, ${name}` : ""}
          </ThemedText>
          <View style={styles.headerActions}>
            <TourTarget id={ONBOARDING_ADD_FRIEND_TARGET_ID}>
              <Pressable
                onPress={() => router.push("/(app)/friends")}
                hitSlop={12}
                style={styles.settingsButton}
                accessibilityRole="button"
                accessibilityLabel="Friends"
              >
                <Ionicons
                  name="people-outline"
                  size={24}
                  color={BrandColors.neutralMuted}
                />
              </Pressable>
            </TourTarget>
            <Pressable
              onPress={() => router.push("/profile")}
              hitSlop={12}
              style={styles.settingsButton}
              accessibilityRole="button"
              accessibilityLabel="Open profile and settings"
            >
              <Ionicons
                name="settings-outline"
                size={24}
                color={BrandColors.neutralMuted}
              />
            </Pressable>
          </View>
        </View>
        <ThemedText style={styles.sub}>
          Capture place-true memories and find them on your map.
        </ThemedText>

        {isLoading ? (
          <ActivityIndicator color={BrandColors.primary} />
        ) : (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <ThemedText type="subtitle">
                {stats?.totalMemories ?? 0}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Memories</ThemedText>
            </View>
            <View style={styles.statCard}>
              <ThemedText type="subtitle">
                {stats?.placesVisited ?? 0}
              </ThemedText>
              <ThemedText style={styles.statLabel}>Places</ThemedText>
            </View>
          </View>
        )}

        <Pressable style={styles.cta} onPress={() => router.push("/camera")}>
          <ThemedText style={styles.ctaText}>Open camera</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.cta, styles.ctaSecondary]}
          onPress={() => router.push("/explore")}
        >
          <ThemedText style={styles.ctaTextSecondary}>View map</ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.gray900 },
  content: { flex: 1, padding: 24, gap: 16 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { color: BrandColors.neutral, flex: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  settingsButton: { padding: 4 },
  sub: { color: BrandColors.neutralMuted, fontSize: 16, lineHeight: 24 },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: BrandColors.elevated,
    borderRadius: 14,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: BrandColors.neutralBorder,
  },
  statLabel: { color: BrandColors.neutralMuted, fontSize: 14 },
  cta: {
    backgroundColor: BrandColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaSecondary: {
    backgroundColor: BrandColors.elevated,
    borderWidth: 1,
    borderColor: BrandColors.neutralBorder,
  },
  ctaText: { color: BrandColors.neutral, fontWeight: "600", fontSize: 16 },
  ctaTextSecondary: {
    color: BrandColors.neutral,
    fontWeight: "600",
    fontSize: 16,
  },
});
