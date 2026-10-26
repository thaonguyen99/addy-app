import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";

import { mapBoundsKey, queryKeys } from "@/services/query/keys";
import { memoryApi } from "./memories.api";
import type {
  ClusterMemory,
  MapBounds,
  MemoryDetail,
  MemoryListItem,
  UpdateMemoryInput,
} from "./memories.type";

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
    },
  });
}

export function useMemoriesMapQuery(bounds: MapBounds | null) {
  const key = bounds ? mapBoundsKey(bounds) : "idle";
  return useQuery({
    queryKey: queryKeys.map(key),
    queryFn: () => memoryApi.getMapPins(bounds!),
    enabled: Boolean(bounds),
  });
}

export function useFriendsMapQuery(bounds: MapBounds | null) {
  const key = bounds ? mapBoundsKey(bounds) : "idle";
  return useQuery({
    queryKey: queryKeys.friendsMap(key),
    queryFn: () => memoryApi.getFriendsMapPins(bounds!),
    enabled: Boolean(bounds),
  });
}

export function usePlaceMemoriesQuery(placeId: string | null) {
  return useQuery({
    queryKey: queryKeys.placeMemories(placeId ?? "idle"),
    queryFn: () => memoryApi.getPlaceMemories(placeId!),
    enabled: Boolean(placeId),
  });
}

/**
 * Every memory inside a group of map pins, newest first. A pin that stands
 * for several memories at one place is expanded via its place's list; a
 * single-memory pin is used as-is.
 */
export function useClusterMemoriesQuery(
  pins: readonly {
    id: string;
    placeId: string;
    imageUrl: string;
    capturedAt: string;
    memoryCount: number;
  }[],
) {
  const multi = pins.filter((pin) => pin.memoryCount > 1);
  const results = useQueries({
    queries: multi.map((pin) => ({
      queryKey: queryKeys.placeMemories(pin.placeId),
      queryFn: () => memoryApi.getPlaceMemories(pin.placeId),
    })),
  });

  const memories = new Map<string, ClusterMemory>();
  for (const pin of pins) {
    if (pin.memoryCount <= 1) {
      memories.set(pin.id, {
        id: pin.id,
        imageUrl: pin.imageUrl,
        capturedAt: pin.capturedAt,
      });
    }
  }
  results.forEach((result, i) => {
    const place = result.data;
    if (!place) {
      // Until the place list loads (or if it fails), show its cover pin.
      const pin = multi[i];
      if (result.isError) {
        memories.set(pin.id, {
          id: pin.id,
          imageUrl: pin.imageUrl,
          capturedAt: pin.capturedAt,
        });
      }
      return;
    }
    for (const memory of place) {
      memories.set(memory.id, {
        id: memory.id,
        imageUrl: memory.imageUrl,
        capturedAt: memory.capturedAt,
      });
    }
  });

  return {
    memories: [...memories.values()].sort((a, b) =>
      b.capturedAt.localeCompare(a.capturedAt),
    ),
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
    },
  });
}
