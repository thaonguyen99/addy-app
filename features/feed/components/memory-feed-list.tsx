import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BrandColors } from "@/constants/theme";
import { MemoryFeedCard } from "@/features/feed/components/memory-feed-card";
import { useMemoryFeed } from "@/features/feed/hooks/use-memory-feed";
import { useProfileQuery } from "@/lib/query/hooks";
import type { MemoryListItem } from "@/types/api";

type MemoryFeedListProps = {
  /** True while the drawer is open — gates fetching and refetch. */
  active: boolean;
  onDismiss: () => void;
};

export function MemoryFeedList({ active, onDismiss }: MemoryFeedListProps) {
  const {
    items,
    isLoading,
    isError,
    isRefetching,
    isFetchingNextPage,
    refetch,
    fetchNextPage,
  } = useMemoryFeed(active);
  const { data: profile } = useProfileQuery(active);

  const authorName =
    profile?.displayName ?? profile?.email?.split("@")[0] ?? "You";

  const openMemory = useCallback(
    (id: string) => {
      onDismiss();
      router.push(`/memory/${id}`);
    },
    [onDismiss],
  );

  const renderItem = useCallback(
    ({ item }: { item: MemoryListItem }) => (
      <MemoryFeedCard
        memory={item}
        authorName={authorName}
        onPress={openMemory}
      />
    ),
    [authorName, openMemory],
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={BrandColors.primary} size="large" />
      </View>
    );
  }

  if (isError && items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emoji}>😕</Text>
        <Text style={styles.muted}>Could not load your memories.</Text>
        <Pressable style={styles.retry} onPress={refetch}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <BottomSheetFlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      style={styles.list}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onEndReachedThreshold={0.4}
      onEndReached={fetchNextPage}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={BrandColors.neutralMuted}
        />
      }
      ListEmptyComponent={
        <View style={styles.center}>
          <Text style={styles.emoji}>📭</Text>
          <Text style={styles.muted}>
            No memories yet. Capture your first one from the camera tab.
          </Text>
        </View>
      }
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={styles.footer}>
            <ActivityIndicator color={BrandColors.neutralMuted} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { paddingBottom: 32, flexGrow: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 32,
    minHeight: 240,
  },
  emoji: { fontSize: 36 },
  muted: {
    color: BrandColors.neutralMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  retry: {
    marginTop: 4,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: BrandColors.elevated,
  },
  retryText: { color: BrandColors.neutral, fontWeight: "600" },
  footer: { paddingVertical: 20 },
});
