import { router } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ui/themed-text";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useStatsQuery } from "@/lib/query/hooks";
import { BrandColors } from "@/constants/theme";

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { data: stats, isLoading } = useStatsQuery();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Hi{user?.displayName ? `, ${user.displayName}` : ""}
        </ThemedText>
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
        <Pressable
          onPress={() => {
            void signOut().then(() => router.replace("/sign-in"));
          }}
          style={styles.signOut}
        >
          <ThemedText style={styles.signOutText}>Sign out</ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.gray900 },
  content: { flex: 1, padding: 24, gap: 16 },
  title: { color: BrandColors.neutral },
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
  signOut: { marginTop: "auto", alignItems: "center", paddingVertical: 12 },
  signOutText: { color: BrandColors.neutralMuted, fontSize: 15 },
});
