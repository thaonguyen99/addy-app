import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFloatingTabBarInset } from "@/components/navigation/floating-tab-bar";
import { ChatBubbleBanner } from "@/components/ui/chat-bubble-banner";
import { GlossyButton } from "@/components/ui/glossy-button";
import { IconCircleButton } from "@/components/ui/icon-circle-button";
import { SkyBackground } from "@/components/ui/sky-background";
import { AddyColors, AddyFonts, BrandColors } from "@/constants/theme";
import {
  feedItemToTile,
  MemoryGridTile,
  QueuedGridTile,
} from "@/features/feed/memory-grid-tile";
import { shareProfileLink } from "@/features/invite/share-invite";
import type { QueuedPin } from "@/features/pin-queue/pin-queue-types";
import {
  ProfileBio,
  ProfileIdentity,
  ProfileSectionHeader,
  ProfileTopRow,
} from "@/features/profile/components/profile-header";
import { ProfileStatsCard } from "@/features/profile/components/profile-stats-card";
import {
  GRID_COLUMNS,
  GRID_GAP,
  PROFILE_SIDE_PADDING,
  useGridTileSize,
} from "@/features/profile/grid-layout";
import { useFriendPinNearby } from "@/hooks/use-friend-pin-nearby";
import type { MemoryListItem } from "@/services/memories";
import { useMemoryFeed } from "@/services/memories";
import { useUserProfileQuery } from "@/services/users";
import { useAuthStore } from "@/stores/auth.store";
import { openEditProfile } from "@/stores/edit-profile.store";
import { useMapFocusStore } from "@/stores/map-focus.store";
import { usePinQueueStore } from "@/stores/pin-queue.store";

/** Grid rows: queued (not yet uploaded) pins first, then server memories. */
type GridItem =
  | { kind: "queued"; key: string; pin: QueuedPin }
  | { kind: "memory"; key: string; memory: MemoryListItem };

/** The You tab: your own profile, editable, and every memory you've pinned. */
export default function YouScreen() {
  const user = useAuthStore((s) => s.user);
  const username = user?.username ?? "";
  const profile = useUserProfileQuery(username);
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
  const tileSize = useGridTileSize();
  const tabBarInset = useFloatingTabBarInset();
  const { pin: nearbyFriendPin, dismiss: dismissNearbyPin } =
    useFriendPinNearby();
  const setPendingFocus = useMapFocusStore((s) => s.setPendingFocus);

  const onOpenNearbyPin = () => {
    if (!nearbyFriendPin) return;
    dismissNearbyPin();
    setPendingFocus({
      latitude: nearbyFriendPin.latitude,
      longitude: nearbyFriendPin.longitude,
    });
    router.navigate("/(app)/(tabs)/explore");
  };

  const openMemory = useCallback((id: string) => {
    router.push(`/memory/${id}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: GridItem }) =>
      item.kind === "queued" ? (
        <QueuedGridTile pin={item.pin} size={tileSize} />
      ) : (
        <MemoryGridTile
          memory={feedItemToTile(item.memory)}
          size={tileSize}
          onPress={openMemory}
        />
      ),
    [openMemory, tileSize],
  );

  const header = (
    <View style={styles.headerContent}>
      <ProfileTopRow
        title={`@${username}`}
        left={
          <IconCircleButton
            accessibilityLabel="Invite friends"
            size={36}
            onPress={() => router.navigate("/(app)/(tabs)/friends?tab=invite")}
          >
            <Text style={styles.headerEmoji}>💌</Text>
          </IconCircleButton>
        }
        right={
          <IconCircleButton
            accessibilityLabel="Settings"
            size={36}
            onPress={() => router.push("/profile")}
          >
            <Text style={styles.headerEmoji}>⚙️</Text>
          </IconCircleButton>
        }
      />

      <ProfileIdentity
        user={user}
        name={user?.name || username}
        below={
          user?.bio ? (
            <ProfileBio text={user.bio} />
          ) : (
            <Pressable
              onPress={openEditProfile}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={styles.addBio}>Add a bio</Text>
            </Pressable>
          )
        }
      />

      <ProfileStatsCard
        stats={profile.data?.stats ?? null}
        onPressFriends={() => router.navigate("/(app)/(tabs)/friends")}
      />

      <View style={styles.actions}>
        <GlossyButton
          label="✏️ Edit profile"
          variant="ghost"
          onPress={openEditProfile}
          style={styles.edit}
        />
        <IconCircleButton
          accessibilityLabel="Share your profile link"
          size={50}
          onPress={() => shareProfileLink(username)}
        >
          <Text style={styles.shareEmoji}>🔗</Text>
        </IconCircleButton>
      </View>

      <ProfileSectionHeader
        title="Your memories"
        onPressMap={() => router.navigate("/(app)/(tabs)/explore")}
      />
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
  content: { paddingHorizontal: PROFILE_SIDE_PADDING },
  column: { gap: GRID_GAP },
  separator: { height: GRID_GAP },
  headerContent: { gap: 16, marginBottom: 12 },
  headerEmoji: { fontSize: 17 },
  shareEmoji: { fontSize: 20 },
  addBio: {
    fontFamily: AddyFonts.bodyMedium,
    fontSize: 14,
    color: BrandColors.link,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: 10 },
  edit: { flex: 1 },
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
