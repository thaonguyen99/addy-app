import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TourTarget } from "@wrack/react-native-tour-guide";

import { ThemedText } from "@/components/ui/themed-text";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useMemoryFeed } from "@/features/feed/hooks/use-memory-feed";
import { MemoryThumbnail } from "@/features/feed/components/memory-thumbnail";
import { ONBOARDING_ADD_FRIEND_TARGET_ID } from "@/features/onboarding/onboarding-tour";
import { useStatsQuery } from "@/lib/query/hooks";
import { BrandColors } from "@/constants/theme";

const GRID_COLUMNS = 3;
const GRID_GAP = 10;
const GRID_PREVIEW_COUNT = 9;

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading } = useStatsQuery();
  const { items: memories } = useMemoryFeed(true);
  const { width: screenWidth } = useWindowDimensions();

  const name =
    user?.name || user?.username || user?.email?.split("@")[0] || "";

  const gridPadding = 24;
  const tileSize =
    (screenWidth - gridPadding * 2 - GRID_GAP * (GRID_COLUMNS - 1)) /
    GRID_COLUMNS;
  const previewMemories = memories.slice(0, GRID_PREVIEW_COUNT);

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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

        {previewMemories.length > 0 ? (
          <View style={styles.gridSection}>
            <View style={styles.gridHeaderRow}>
              <ThemedText type="subtitle" style={styles.gridHeading}>
                Your memories
              </ThemedText>
              <Pressable onPress={() => router.push("/(app)/memories")}>
                <Text style={styles.viewAll}>View all</Text>
              </Pressable>
            </View>
            <View style={[styles.grid, { gap: GRID_GAP }]}>
              {previewMemories.map((memory) => (
                <MemoryThumbnail
                  key={memory.id}
                  memory={memory}
                  size={tileSize}
                  onPress={(id) => router.push(`/memory/${id}`)}
                />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.gray900 },
  scroll: { flex: 1 },
  content: { padding: 24, paddingBottom: 40, gap: 16 },
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
  gridSection: { gap: 12, marginTop: 4 },
  gridHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gridHeading: { color: BrandColors.neutral },
  viewAll: { color: BrandColors.primary, fontWeight: "600", fontSize: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
});
