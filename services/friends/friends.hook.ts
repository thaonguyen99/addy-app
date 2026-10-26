import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { queryKeys } from "@/services/query/keys";
import { friendApi } from "./friends.api";
import type { FriendRequestDirection } from "./friends.type";

const FRIENDS_STALE = 15_000;

export function useFriendsQuery(enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.friends,
    queryFn: ({ pageParam }) => friendApi.listFriends(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: FRIENDS_STALE,
    enabled,
  });
}

export function useFriendRequestsQuery(
  direction: FriendRequestDirection,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.friendRequests(direction),
    queryFn: ({ pageParam }) =>
      friendApi.listFriendRequests(direction, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: FRIENDS_STALE,
    enabled,
  });
}

/** Friends of friends. Errors (e.g. an older server) just hide the row. */
export function useFriendSuggestionsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.friendSuggestions,
    queryFn: () => friendApi.listFriendSuggestions(),
    staleTime: 60_000,
    retry: false,
    enabled,
  });
}

/**
 * Invalidate every friends/requests/suggestions/search/map list after a graph
 * change. `queryKeys.friends` is the prefix of requests and suggestions too.
 */
export function invalidateSocialLists(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.friends });
  queryClient.invalidateQueries({ queryKey: ["friends", "requests"] });
  queryClient.invalidateQueries({ queryKey: ["users", "search"] });
  queryClient.invalidateQueries({ queryKey: ["memories", "friends-map"] });
  queryClient.invalidateQueries({ queryKey: queryKeys.blockedUsers });
}

export function useSendFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendApi.sendFriendRequest(userId),
    onSuccess: () => invalidateSocialLists(queryClient),
  });
}

export function useAcceptFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => friendApi.acceptFriendRequest(id),
    onSuccess: () => invalidateSocialLists(queryClient),
  });
}

export function useDeclineFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => friendApi.declineFriendRequest(id),
    onSuccess: () => invalidateSocialLists(queryClient),
  });
}

export function useCancelFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => friendApi.cancelFriendRequest(id),
    onSuccess: () => invalidateSocialLists(queryClient),
  });
}

export function useUnfriendMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendApi.unfriend(userId),
    onSuccess: () => invalidateSocialLists(queryClient),
  });
}
