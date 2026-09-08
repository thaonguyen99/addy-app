import { useMemo } from "react";

import { useMemoriesFeedQuery } from "@/lib/query/hooks";
import type { MemoryListItem } from "@/types/api";

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
