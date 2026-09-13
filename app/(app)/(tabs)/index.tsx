import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TourTarget } from "@wrack/react-native-tour-guide";

import { ChatBubbleBanner } from "@/components/ui/chat-bubble-banner";
import { StatChip } from "@/components/ui/stat-chip";
import { ThemedText } from "@/components/ui/themed-text";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useMemoryFeed } from "@/features/feed/hooks/use-memory-feed";
import { MemoryFeedCard } from "@/features/feed/components/memory-feed-card";
import { useMapFocusStore } from "@/features/map/store/map-focus-store";
import { ONBOARDING_ADD_FRIEND_TARGET_ID } from "@/features/onboarding/onboarding-tour";
import { useFriendPinNearby } from "@/features/social/hooks/use-friend-pin-nearby";
import { useStatsQuery } from "@/lib/query/hooks";
import { BrandColors } from "@/constants/theme";
import type { MemoryListItem } from "@/types/api";

const GRID_COLUMNS = 2;
const GRID_GAP = 12;
const GRID_PADDING = 24;

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading: statsLoading } = useStatsQuery();
  const {
    items: memories,
    isLoading: memoriesLoading,
    isRefetching,
    isFetchingNextPage,
    refetch,
    fetchNextPage,
  } = useMemoryFeed(true);
  const { width: screenWidth } = useWindowDimensions();
  const { pin: nearbyFriendPin, dismiss: dismissNearbyPin } =
    useFriendPinNearby();
  const setPendingFocus = useMapFocusStore((s) => s.setPendingFocus);

  const name =
    user?.name || user?.username || user?.email?.split("@")[0] || "";

  const onOpenNearbyPin = () => {
    if (!nearbyFriendPin) return;
    dismissNearbyPin();
    setPendingFocus({
      latitude: nearbyFriendPin.latitude,
      longitude: nearbyFriendPin.longitude,
    });
    router.push("/(app)/(tabs)/explore");
  };

  const tileSize =
    (screenWidth - GRID_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) /
    GRID_COLUMNS;

  const openMemory = useCallback((id: string) => {
    router.push(`/memory/${id}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: MemoryListItem }) => (
      <View style={{ width: tileSize }}>
        <MemoryFeedCard memory={item} onPress={openMemory} />
      </View>
    ),
    [openMemory, tileSize],
  );

  const header = (
    <View style={styles.headerContent}>
      <View style={styles.titleRow}>
        <ThemedText type="title" style={styles.title}>
          Hi{name ? `, ${name}` : ""} ✨
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
                color={BrandColors.inkMuted}
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
              color={BrandColors.inkMuted}
            />
          </Pressable>
        </View>
      </View>
      <ThemedText style={styles.sub}>
        Capture place-true memories and find them on your map.
      </ThemedText>

      {statsLoading ? (
        <ActivityIndicator color={BrandColors.primary} />
      ) : (
        <View style={styles.statsRow}>
          <StatChip value={stats?.totalMemories ?? 0} label="memories" />
          <StatChip value={stats?.placesVisited ?? 0} label="places" />
        </View>
      )}

      <ThemedText type="subtitle" style={styles.gridHeading}>
        Your memories
      </ThemedText>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ChatBubbleBanner
        visible={nearbyFriendPin !== null}
        onPress={onOpenNearbyPin}
      >
        <Text style={styles.nearbyBannerText} numberOfLines={2}>
          {nearbyFriendPin
            ? `${nearbyFriendPin.author.name || nearbyFriendPin.author.username} pinned a memory nearby ›`
            : ""}
        </Text>
      </ChatBubbleBanner>
      <FlatList
        data={memories}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={GRID_COLUMNS}
        columnWrapperStyle={{ gap: GRID_GAP }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        ItemSeparatorComponent={() => <View style={{ height: GRID_GAP }} />}
        onEndReachedThreshold={0.4}
        onEndReached={fetchNextPage}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={BrandColors.inkMuted}
          />
        }
        ListEmptyComponent={
          memoriesLoading ? (
            <ActivityIndicator color={BrandColors.primary} />
          ) : (
            <Text style={styles.emptyText}>
              No memories yet. Capture your first one from the camera tab.
            </Text>
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={BrandColors.inkMuted} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.paper },
  content: { padding: GRID_PADDING, paddingBottom: 40 },
  headerContent: { gap: 16, marginBottom: 16 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { color: BrandColors.ink, flex: 1, fontFamily: "Fredoka-Bold" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  settingsButton: { padding: 4 },
  sub: { color: BrandColors.inkMuted, fontSize: 16, lineHeight: 24 },
  statsRow: { flexDirection: "row", gap: 12 },
  gridHeading: {
    color: BrandColors.ink,
    fontFamily: "Fredoka-SemiBold",
    marginTop: 4,
  },
  emptyText: {
    color: BrandColors.inkMuted,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
  footer: { paddingVertical: 20 },
  nearbyBannerText: {
    color: BrandColors.ink,
    fontSize: 14,
    fontFamily: "Fredoka-SemiBold",
    letterSpacing: 0.2,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
