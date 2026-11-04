import { router } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFloatingTabBarInset } from "@/components/navigation/floating-tab-bar";
import { GlossyButton } from "@/components/ui/glossy-button";
import { SkyBackground } from "@/components/ui/sky-background";
import { AddyColors, AddyFonts } from "@/constants/theme";
import { NotificationBell } from "@/features/notifications/notification-bell";
import {
  type FeedItem,
  useFeed,
  useLikeFeedItemMutation,
} from "@/services/feed";
import { useMapFocusStore } from "@/stores/map-focus.store";
import { formatDayLabel } from "@/utils/format-relative-time";
import { DayDivider } from "./day-divider";
import { FeedCard } from "./feed-card";
import { FeedCardSkeleton } from "./feed-card-skeleton";
import {
  type CardRect,
  LANE_BEHIND_SCALE,
  laneZoomProgress,
} from "./zoom-transition";

const SIDE_PADDING = 16;
const CARD_GAP = 14;

/** Feed rows: a day pill before the first card of each local day. */
type LaneRow =
  | { kind: "day"; key: string; label: string }
  | { kind: "item"; key: string; item: FeedItem };

function toRows(items: FeedItem[]): LaneRow[] {
  const now = Date.now();
  const rows: LaneRow[] = [];
  let lastLabel: string | null = null;
  for (const item of items) {
    const label = formatDayLabel(item.activityAt, now);
    if (label !== lastLabel) {
      rows.push({ kind: "day", key: `day-${item.id}`, label });
      lastLabel = label;
    }
    rows.push({ kind: "item", key: item.id, item });
  }
  return rows;
}

/** The Memory Lane tab: friends' memories and yours, newest activity first. */
export function LaneScreen() {
  const {
    items,
    isLoading,
    isError,
    isRefetching,
    isFetchingNextPage,
    refetch,
    fetchNextPage,
  } = useFeed();
  const { mutate: likeMemory } = useLikeFeedItemMutation();
  const setPendingFocus = useMapFocusStore((s) => s.setPendingFocus);
  const tabBarInset = useFloatingTabBarInset();
  const { width } = useWindowDimensions();
  const cardWidth = width - SIDE_PADDING * 2;
  const rows = useMemo(() => toRows(items), [items]);

  const onLike = useCallback(
    (item: FeedItem) => {
      // Already liked: the heart still plays, but there's nothing to send.
      if (!item.likedByMe) likeMemory(item.id);
    },
    [likeMemory],
  );

  // One chat per burst of taps: each would push its own copy.
  const lastOpenAt = useRef(0);
  const onOpen = useCallback((id: string, rect: CardRect | null) => {
    const now = Date.now();
    if (now - lastOpenAt.current < 800) return;
    lastOpenAt.current = now;
    router.push({
      pathname: "/memory-zoom/[id]",
      params: rect
        ? { id, x: rect.x, y: rect.y, w: rect.width, h: rect.height }
        : { id },
    });
  }, []);

  // Shrinks behind a chat zooming out of one of the cards.
  const reducedMotion = useReducedMotion();
  const behindStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: reducedMotion
          ? 1
          : 1 + (LANE_BEHIND_SCALE - 1) * laneZoomProgress.value,
      },
    ],
  }));

  const onOpenMap = useCallback(
    (item: FeedItem) => {
      setPendingFocus({
        latitude: item.place.lat,
        longitude: item.place.lng,
        withFriends: !item.isMine,
      });
      router.navigate("/(app)/(tabs)/explore");
    },
    [setPendingFocus],
  );

  const renderItem = useCallback(
    ({ item: row }: { item: LaneRow }) =>
      row.kind === "day" ? (
        <DayDivider label={row.label} />
      ) : (
        <FeedCard
          item={row.item}
          width={cardWidth}
          onLike={onLike}
          onOpen={onOpen}
          onOpenMap={onOpenMap}
        />
      ),
    [cardWidth, onLike, onOpen, onOpenMap],
  );

  let body;
  if (isLoading) {
    body = (
      <View style={[styles.content, styles.skeletons]}>
        {[0, 1, 2].map((i) => (
          <FeedCardSkeleton key={i} width={cardWidth} />
        ))}
      </View>
    );
  } else if (isError && items.length === 0) {
    body = (
      <View style={styles.center}>
        <Text style={styles.emoji}>😕</Text>
        <Text style={styles.message}>Couldn&apos;t load Memory Lane.</Text>
        <GlossyButton label="Try again" variant="ghost" onPress={refetch} />
      </View>
    );
  } else {
    body = (
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: tabBarInset },
          rows.length === 0 && styles.grow,
        ]}
        ItemSeparatorComponent={CardGap}
        showsVerticalScrollIndicator={false}
        onEndReachedThreshold={0.5}
        onEndReached={fetchNextPage}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={AddyColors.inkMuted}
          />
        }
        ListEmptyComponent={<LaneEmpty />}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator color={AddyColors.inkMuted} />
            </View>
          ) : null
        }
      />
    );
  }

  return (
    <Animated.View style={[styles.safe, behindStyle]}>
      <SkyBackground>
        <SafeAreaView style={styles.safe} edges={["top"]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle} accessibilityRole="header">
              Memory Lane
            </Text>
            <NotificationBell showBadge={false} />
          </View>
          {body}
        </SafeAreaView>
      </SkyBackground>
    </Animated.View>
  );
}

function CardGap() {
  return <View style={styles.gap} />;
}

function LaneEmpty() {
  return (
    <View style={styles.center}>
      <Text style={styles.emoji}>🎞️</Text>
      <Text style={styles.message}>
        Nothing here yet. Pin a memory or bring your friends along!
      </Text>
      <View style={styles.actions}>
        <GlossyButton
          label="📸 Open camera"
          onPress={() => router.push("/capture")}
        />
        <GlossyButton
          label="💌 Invite friends"
          variant="ghost"
          onPress={() => router.navigate("/(app)/(tabs)/friends?tab=invite")}
        />
      </View>
    </View>
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
    paddingBottom: 6,
  },
  headerTitle: {
    fontFamily: AddyFonts.title,
    fontSize: 26,
    lineHeight: 36,
    color: AddyColors.ink,
  },
  content: { paddingHorizontal: SIDE_PADDING, paddingTop: 8 },
  skeletons: { gap: CARD_GAP },
  grow: { flexGrow: 1 },
  gap: { height: CARD_GAP },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  emoji: { fontSize: 44 },
  message: {
    fontFamily: AddyFonts.bodyMedium,
    fontSize: 15,
    lineHeight: 22,
    color: AddyColors.ink,
    textAlign: "center",
  },
  actions: { alignSelf: "stretch", gap: 10, marginTop: 4 },
  footer: { paddingVertical: 20 },
});
