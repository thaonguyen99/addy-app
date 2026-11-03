import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";

import { queryKeys } from "@/services/query/keys";
import { feedApi } from "./feed.api";
import { type FeedPages, patchFeedItem } from "./feed.cache";

/** Memory Lane: friends' and your memories, newest activity first. */
export function useFeed() {
  const query = useInfiniteQuery({
    queryKey: queryKeys.feed,
    queryFn: ({ pageParam }) => feedApi.getFeed(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });

  const items = useMemo(() => {
    const flat = query.data?.pages.flatMap((page) => page.items) ?? [];
    // Activity can bump a memory between page loads — keep keys unique.
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
    isRefetching: query.isRefetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
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

/** Double-tap like: optimistic in the feed, rolled back if the request fails. */
export function useLikeFeedItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => feedApi.likeMemory(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.feed });
      const previous = queryClient.getQueryData<FeedPages>(queryKeys.feed);
      patchFeedItem(queryClient, id, (item) =>
        item.likedByMe
          ? item
          : { ...item, likedByMe: true, likeCount: item.likeCount + 1 },
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.feed, context.previous);
      }
    },
    onSettled: (_data, _error, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.memory(id) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.memoryReactions(id),
      });
    },
  });
}
