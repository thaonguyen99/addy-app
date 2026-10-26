import { router } from "expo-router";
import { useCallback, useMemo } from "react";
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

import { useFloatingTabBarInset } from "@/components/navigation/floating-tab-bar";
import { ChatBubbleBanner } from "@/components/ui/chat-bubble-banner";
import { IconCircleButton } from "@/components/ui/icon-circle-button";
import { SkyBackground } from "@/components/ui/sky-background";
import { TechChip } from "@/components/ui/tech-chip";
import { AddyColors, AddyFonts } from "@/constants/theme";
import {
  MemoryGridTile,
  QueuedGridTile,
} from "@/features/feed/memory-grid-tile";
import { ChatAvatar } from "@/features/memory/chat-avatar";
import type { QueuedPin } from "@/features/pin-queue/pin-queue-types";
import { useFriendPinNearby } from "@/hooks/use-friend-pin-nearby";
import type { MemoryListItem } from "@/services/memories";
import { useMemoryFeed } from "@/services/memories";
import { useStatsQuery } from "@/services/users";
import { useAuthStore } from "@/stores/auth.store";
import { useMapFocusStore } from "@/stores/map-focus.store";
import { usePinQueueStore } from "@/stores/pin-queue.store";

const GRID_COLUMNS = 3;
const GRID_GAP = 3;
const SIDE_PADDING = 16;

/** Grid rows: queued (not yet uploaded) pins first, then server memories. */
type GridItem =
  | { kind: "queued"; key: string; pin: QueuedPin }
  | { kind: "memory"; key: string; memory: MemoryListItem };

/** The You tab: your profile header and a grid of every memory you've pinned. */
export default function YouScreen() {
  const user = useAuthStore((s) => s.user);
  const { data: stats } = useStatsQuery();
  const {
    items: memories,
    isLoading: memoriesLoading,
    isRefetching,
    isFetchingNextPage,
    refetch,
    fetchNextPage,
  } = useMemoryFeed(true);
  const queuedPins = usePinQueueStore((s) => s.entries);
  const gridItems = useMemo<GridItem[]>(
    () => [
      ...[...queuedPins].reverse().map((pin) => ({
        kind: "queued" as const,
        key: `queued-${pin.clientId}`,
        pin,
      })),
      ...memories.map((memory) => ({
        kind: "memory" as const,
        key: memory.id,
        memory,
      })),
    ],
    [queuedPins, memories],
  );
  const { width: screenWidth } = useWindowDimensions();
  const tabBarInset = useFloatingTabBarInset();
  const { pin: nearbyFriendPin, dismiss: dismissNearbyPin } =
    useFriendPinNearby();
  const setPendingFocus = useMapFocusStore((s) => s.setPendingFocus);

  const username = user?.username ?? user?.email?.split("@")[0] ?? "";

  const onOpenNearbyPin = () => {
    if (!nearbyFriendPin) return;
    dismissNearbyPin();
    setPendingFocus({
      latitude: nearbyFriendPin.latitude,
      longitude: nearbyFriendPin.longitude,
    });
    router.navigate("/(app)/(tabs)/explore");
  };

  const tileSize = Math.floor(
    (screenWidth - SIDE_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) /
      GRID_COLUMNS,
  );

  const openMemory = useCallback((id: string) => {
    router.push(`/memory/${id}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: GridItem }) =>
      item.kind === "queued" ? (
        <QueuedGridTile pin={item.pin} size={tileSize} />
      ) : (
        <MemoryGridTile
          memory={item.memory}
          size={tileSize}
          onPress={openMemory}
        />
      ),
    [openMemory, tileSize],
  );

  const header = (
    <View style={styles.headerContent}>
      <View style={styles.profileRow}>
        <ChatAvatar
          user={user ? { username, avatarUrl: user.avatarUrl } : null}
          size={52}
        />
        <View style={styles.profileText}>
          <Text style={styles.username} numberOfLines={1}>
            {username}
          </Text>
          {user?.bio ? (
            <Text style={styles.bio} numberOfLines={2}>
              {user.bio}
            </Text>
          ) : null}
        </View>
        <IconCircleButton
          accessibilityLabel="Invite friends"
          size={36}
          onPress={() => router.navigate("/(app)/(tabs)/friends?tab=invite")}
        >
          <Text style={styles.headerEmoji}>💌</Text>
        </IconCircleButton>
        <IconCircleButton
          accessibilityLabel="Profile settings"
          size={36}
          onPress={() => router.push("/profile")}
        >
          <Text style={styles.headerEmoji}>⚙️</Text>
        </IconCircleButton>
      </View>

      <View style={styles.statsRow}>
        <TechChip label={`${stats?.totalMemories ?? "–"} memories`} />
        <TechChip label={`${stats?.placesVisited ?? "–"} places`} />
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Your memories</Text>
        <Pressable
          onPress={() => router.navigate("/(app)/(tabs)/explore")}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Open the map"
        >
          <Text style={styles.sectionLink}>map ›</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SkyBackground>
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
          data={gridItems}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          numColumns={GRID_COLUMNS}
          columnWrapperStyle={styles.column}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: tabBarInset },
          ]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={header}
          ItemSeparatorComponent={GridSeparator}
          onEndReachedThreshold={0.4}
          onEndReached={fetchNextPage}
          removeClippedSubviews
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={AddyColors.inkMuted}
            />
          }
          ListEmptyComponent={
            memoriesLoading ? (
              <ActivityIndicator color={AddyColors.ink} />
            ) : (
              <Text style={styles.emptyText}>
                No memories yet. Tap the camera to pin your first one.
              </Text>
            )
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}>
                <ActivityIndicator color={AddyColors.inkMuted} />
              </View>
            ) : null
          }
        />
      </SafeAreaView>
    </SkyBackground>
  );
}

function GridSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: SIDE_PADDING, paddingTop: 8 },
  column: { gap: GRID_GAP },
  separator: { height: GRID_GAP },
  headerContent: { gap: 14, marginBottom: 12 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  profileText: { flex: 1, gap: 2 },
  username: {
    fontFamily: AddyFonts.title,
    fontSize: 22,
    lineHeight: 32,
    color: AddyColors.ink,
  },
  bio: {
    fontFamily: AddyFonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: AddyColors.inkMuted,
  },
  headerEmoji: { fontSize: 17 },
  statsRow: { flexDirection: "row", gap: 8 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: AddyFonts.title,
    fontSize: 17,
    lineHeight: 24,
    color: AddyColors.ink,
  },
  sectionLink: {
    fontFamily: AddyFonts.tech,
    fontSize: 19,
    color: AddyColors.ink,
  },
  emptyText: {
    fontFamily: AddyFonts.body,
    color: AddyColors.inkMuted,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
  footer: { paddingVertical: 20 },
  nearbyBannerText: {
    color: AddyColors.ink,
    fontSize: 14,
    fontFamily: AddyFonts.titleSemiBold,
    letterSpacing: 0.2,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
