import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/services/query/keys";
import type { FeedItem, FeedPage } from "./feed.type";

export type FeedPages = InfiniteData<FeedPage, string | undefined>;

export function patchFeedItem(
  queryClient: QueryClient,
  id: string,
  patch: (item: FeedItem) => FeedItem,
) {
  queryClient.setQueryData<FeedPages>(
    queryKeys.feed,
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.map((item) => (item.id === id ? patch(item) : item)),
        })),
      },
  );
}

/** Memory Lane is stale: a memory, like or comment changed somewhere. */
export function invalidateFeed(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.feed });
}
