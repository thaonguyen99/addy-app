import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";

import { invalidateFeed } from "@/services/feed/feed.cache";
import { mapBoundsKey, queryKeys } from "@/services/query/keys";
import { useAuthStore } from "@/stores/auth.store";
import { memoryApi } from "./memories.api";
import type {
  ClusterMemory,
  FriendMemoryPin,
  MapBounds,
  MapScope,
  MemoryPin,
  MemoryDetail,
  MemoryListItem,
  UpdateMemoryInput,
} from "./memories.type";
import { deviceTimezone } from "@/services/notifications/notifications.push";

/** Every memory the user has created, newest first — feeds the map drawer. */
export function useMemoriesFeedQuery(enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.memoriesFeed,
    queryFn: ({ pageParam }) =>
      memoryApi.listMemories({ cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
  });
}

export type UseMemoryFeed = {
  items: MemoryListItem[];
  isLoading: boolean;
  isError: boolean;
  isRefetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  refetch: () => void;
  fetchNextPage: () => void;
};

/**
 * Flattens the paginated feed query into a single list for the drawer.
 * `enabled` is driven by the drawer's open state so we don't fetch until shown.
 */
export function useMemoryFeed(enabled: boolean): UseMemoryFeed {
  const query = useMemoriesFeedQuery(enabled);

  const items = useMemo(() => {
    const flat = query.data?.pages.flatMap((page) => page.items) ?? [];
    // Guard against an id appearing in two pages (cursor races) — FlatList
    // keys must stay unique.
    const seen = new Set<string>();
    return flat.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [query.data]);

  return {
    items,
    isLoading: query.isLoading,
    isError: query.isError,
    isRefetching: query.isRefetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    refetch: () => {
      void query.refetch();
    },
    fetchNextPage: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        void query.fetchNextPage();
      }
    },
  };
}

/** The pinned On this day card on the 🔔 list; empty means no card. */
export function useOnThisDayQuery() {
  const tz = deviceTimezone() ?? "UTC";
  return useQuery({
    queryKey: queryKeys.onThisDay(tz),
    queryFn: () => memoryApi.listOnThisDay(tz),
    staleTime: 5 * 60_000,
  });
}

export function useMemoryQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.memory(id ?? ""),
    queryFn: () => memoryApi.getMemory(id!),
    enabled: Boolean(id),
  });
}

export function useDeleteMemoryMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => memoryApi.deleteMemory(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.memory(id) });
      // Broad invalidation: a deleted memory can affect the map, the feed,
      // its place's "memories here" sheet, and lifetime stats all at once.
      queryClient.invalidateQueries({ queryKey: ["memories"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
      queryClient.invalidateQueries({ queryKey: ["users", "profile"] });
      invalidateFeed(queryClient);
    },
  });
}

const MAP_STALE_TIME = 2 * 60_000;

type MapViewport = { visible: MapBounds; buffered: MapBounds };

function useMapPinQuery<Pin extends MemoryPin>(
  viewport: MapViewport | null,
  layer: "map" | "friendsMap",
  fetchPins: (
    bounds: MapBounds,
    signal: AbortSignal,
  ) => Promise<{ pins: Pin[]; cursor?: string }>,
) {
  const userId = useAuthStore((s) => s.user?.id);
  const visible = viewport?.visible;
  const buffered = viewport?.buffered;
  const visibleKey = visible ? mapBoundsKey(visible) : "idle";
  const bufferedKey = buffered ? mapBoundsKey(buffered) : "idle";

  const bufferedQuery = useQuery({
    queryKey: queryKeys[layer](bufferedKey, userId),
    queryFn: ({ signal }) => fetchPins(buffered!, signal),
    enabled: Boolean(userId && buffered),
    staleTime: MAP_STALE_TIME,
  });

  // The first page of a larger viewport can omit visible pins. In that
  // case use the original request and its pagination behavior.
  const needsExact = Boolean(bufferedQuery.data?.cursor && visibleKey !== bufferedKey);
  const exactQuery = useQuery({
    queryKey: queryKeys[layer](needsExact ? visibleKey : "idle", userId),
    queryFn: ({ signal }) => fetchPins(visible!, signal),
    enabled: Boolean(userId && visible && needsExact),
    staleTime: MAP_STALE_TIME,
  });

  const query = needsExact ? exactQuery : bufferedQuery;
  const data = useMemo(() => {
    if (!visible || !query.data) return undefined;
    if (needsExact || visibleKey === bufferedKey) return query.data;
    return {
      pins: query.data.pins.filter(({ latitude, longitude }) =>
        latitude >= visible.south &&
        latitude <= visible.north &&
        longitude >= visible.west &&
        longitude <= visible.east,
      ),
    };
  }, [visible, query.data, needsExact, visibleKey, bufferedKey]);

  return { data, isLoading: query.isLoading, isError: query.isError };
}

export function useMemoriesMapQuery(viewport: MapViewport | null) {
  return useMapPinQuery(viewport, "map", memoryApi.getMapPins);
}

export function useFriendsMapQuery(viewport: MapViewport | null) {
  return useMapPinQuery(viewport, "friendsMap", memoryApi.getFriendsMapPins);
}

/** A map pin tagged with the layer it came from. */
export type ScopedPin = {
  pin: MemoryPin | FriendMemoryPin;
  scope: MapScope;
};

const SCOPES: readonly MapScope[] = ["mine", "friends"];

/** A place's cover pin standing in for its memories until they load. */
function pinToClusterMemory({ pin, scope }: ScopedPin): ClusterMemory {
  return {
    id: pin.id,
    placeId: pin.placeId,
    placeName: pin.placeName ?? "",
    latitude: pin.latitude,
    longitude: pin.longitude,
    imageUrl: pin.imageUrl,
    imageCount: (pin.extraPhotoCount ?? 0) + 1,
    moodScore: pin.moodScore ?? null,
    isOwner: scope === "mine",
    capturedAt: pin.capturedAt,
    ...("author" in pin ? { author: pin.author } : {}),
  };
}

/**
 * Every memory behind a set of map pins, newest first — one request per map
 * layer. Each place's cover pin shows right away, so the sheet opens
 * instantly; the full list replaces it when it arrives (or stays if the
 * request fails).
 */
export function useClusterMemories(pins: readonly ScopedPin[]) {
  const userId = useAuthStore((s) => s.user?.id);
  const placeIdsByScope = useMemo(
    () =>
      SCOPES.map((scope) =>
        [
          ...new Set(
            pins.filter((p) => p.scope === scope).map((p) => p.pin.placeId),
          ),
        ].sort(),
      ),
    [pins],
  );

  const results = useQueries({
    queries: SCOPES.map((scope, i) => {
      const placeIds = placeIdsByScope[i];
      return {
        queryKey: queryKeys.memoriesByPlaces(scope, placeIds.join(","), userId),
        queryFn: () => memoryApi.getMemoriesByPlaces(placeIds, scope),
        enabled: Boolean(userId && placeIds.length),
      };
    }),
  });
  const mineData = results[0].data;
  const friendsData = results[1].data;

  const memories = useMemo(() => {
    const loaded = [mineData, friendsData];
    const list: ClusterMemory[] = [];
    SCOPES.forEach((scope, i) => {
      const data = loaded[i];
      if (data) {
        list.push(...data);
      } else {
        for (const scoped of pins) {
          if (scoped.scope === scope) list.push(pinToClusterMemory(scoped));
        }
      }
    });
    return list.sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  }, [pins, mineData, friendsData]);

  return {
    memories,
    isLoading: results.some((result) => result.isLoading),
  };
}

export function useUpdateMemoryMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMemoryInput) => memoryApi.updateMemory(id, input),
    onSuccess: (memory) => {
      queryClient.setQueryData(queryKeys.memory(id), memory);
      queryClient.invalidateQueries({ queryKey: queryKeys.memoriesFeed });
      queryClient.invalidateQueries({ queryKey: ["memories", "map"] });
      queryClient.invalidateQueries({ queryKey: ["memories", "friends-map"] });
      // The place or cover photo may have changed.
      queryClient.invalidateQueries({ queryKey: ["memories", "place"] });
      invalidateFeed(queryClient);
    },
  });
}

export function useUntagSelfMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => memoryApi.untagSelf(id),
    onSuccess: () => {
      // A private memory is no longer visible once untagged.
      queryClient.removeQueries({ queryKey: queryKeys.memory(id) });
      queryClient.invalidateQueries({ queryKey: ["memories", "friends-map"] });
      queryClient.invalidateQueries({ queryKey: ["memories", "place"] });
      invalidateFeed(queryClient);
    },
  });
}

export function useReactorsQuery(memoryId: string | undefined) {
  return useInfiniteQuery({
    queryKey: queryKeys.memoryReactions(memoryId ?? ""),
    queryFn: ({ pageParam }) => memoryApi.listReactors(memoryId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    enabled: Boolean(memoryId),
  });
}

export function useToggleReactionMutation(memoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => memoryApi.toggleReaction(memoryId),
    onMutate: async () => {
      const key = queryKeys.memory(memoryId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MemoryDetail>(key);
      if (previous) {
        queryClient.setQueryData<MemoryDetail>(key, {
          ...previous,
          hasReacted: !previous.hasReacted,
          reactionCount:
            previous.reactionCount + (previous.hasReacted ? -1 : 1),
        });
      }
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.memory(memoryId), context.previous);
      }
    },
    onSuccess: (result) => {
      const key = queryKeys.memory(memoryId);
      const current = queryClient.getQueryData<MemoryDetail>(key);
      if (current) {
        queryClient.setQueryData<MemoryDetail>(key, {
          ...current,
          hasReacted: result.reacted,
          reactionCount: result.count,
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.memoryReactions(memoryId),
      });
      invalidateFeed(queryClient);
    },
  });
}
