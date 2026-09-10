import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as friendsApi from "@/lib/api/friends";
import * as memoriesApi from "@/lib/api/memories";
import * as notificationsApi from "@/lib/api/notifications";
import * as socialApi from "@/lib/api/social";
import { mapBoundsKey, queryKeys } from "@/lib/query/keys";
import type {
  DevicePlatform,
  FriendRequestDirection,
  MapBounds,
  MemoryDetail,
  NotificationPreferences,
  UpdateMemoryInput,
} from "@/types/api";

const FRIENDS_STALE = 15_000;

// --- Friends & requests -----------------------------------------------------

export function useFriendsQuery(enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.friends,
    queryFn: ({ pageParam }) => friendsApi.listFriends(pageParam),
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
      friendsApi.listFriendRequests(direction, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    staleTime: FRIENDS_STALE,
    enabled,
  });
}

/** Invalidate every friends/requests/search/map list after a graph change. */
function invalidateSocialLists(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.friends });
  queryClient.invalidateQueries({ queryKey: ["friends", "requests"] });
  queryClient.invalidateQueries({ queryKey: ["users", "search"] });
  queryClient.invalidateQueries({ queryKey: ["memories", "friends-map"] });
  queryClient.invalidateQueries({ queryKey: queryKeys.blockedUsers });
}

export function useSendFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendsApi.sendFriendRequest(userId),
    onSuccess: () => invalidateSocialLists(queryClient),
  });
}

export function useAcceptFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => friendsApi.acceptFriendRequest(id),
    onSuccess: () => invalidateSocialLists(queryClient),
  });
}

export function useDeclineFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => friendsApi.declineFriendRequest(id),
    onSuccess: () => invalidateSocialLists(queryClient),
  });
}

export function useCancelFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => friendsApi.cancelFriendRequest(id),
    onSuccess: () => invalidateSocialLists(queryClient),
  });
}

export function useUnfriendMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendsApi.unfriend(userId),
    onSuccess: () => invalidateSocialLists(queryClient),
  });
}

// --- Discovery: search & invite --------------------------------------------

export function useUserSearchQuery(term: string) {
  const q = term.trim();
  return useInfiniteQuery({
    queryKey: queryKeys.userSearch(q.toLowerCase()),
    queryFn: ({ pageParam }) => socialApi.searchUsers(q, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    enabled: q.length >= 2,
    staleTime: 10_000,
  });
}

export function useInviteQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.invite,
    queryFn: socialApi.getMyInvite,
    staleTime: 5 * 60_000,
    enabled,
  });
}

export function useRotateInviteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: socialApi.rotateInvite,
    onSuccess: (invite) => {
      queryClient.setQueryData(queryKeys.invite, invite);
    },
  });
}

export function useResolveInviteQuery(token: string | undefined) {
  return useQuery({
    queryKey: ["users", "invite", "resolve", token ?? ""],
    queryFn: () => socialApi.resolveInvite(token!),
    enabled: Boolean(token),
    retry: false,
  });
}

// --- Blocking --------------------------------------------------------------

export function useBlockedUsersQuery(enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.blockedUsers,
    queryFn: ({ pageParam }) => socialApi.listBlockedUsers(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    enabled,
  });
}

export function useBlockUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => socialApi.blockUser(userId),
    onSuccess: () => invalidateSocialLists(queryClient),
  });
}

export function useUnblockUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => socialApi.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.blockedUsers });
      queryClient.invalidateQueries({ queryKey: ["users", "search"] });
    },
  });
}

// --- Reactions ------------------------------------------------------------

export function useReactorsQuery(memoryId: string | undefined) {
  return useInfiniteQuery({
    queryKey: queryKeys.memoryReactions(memoryId ?? ""),
    queryFn: ({ pageParam }) =>
      memoriesApi.listReactors(memoryId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    enabled: Boolean(memoryId),
  });
}

export function useToggleReactionMutation(memoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => memoriesApi.toggleReaction(memoryId),
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
        queryClient.setQueryData(
          queryKeys.memory(memoryId),
          context.previous,
        );
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

// --- Friends map ---------------------------------------------------------

export function useFriendsMapQuery(bounds: MapBounds | null) {
  const key = bounds ? mapBoundsKey(bounds) : "idle";
  return useQuery({
    queryKey: queryKeys.friendsMap(key),
    queryFn: () => memoriesApi.getFriendsMapPins(bounds!),
    enabled: Boolean(bounds),
  });
}

// --- Memory visibility ---------------------------------------------------

export function useUpdateMemoryMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMemoryInput) =>
      memoriesApi.updateMemory(id, input),
    onSuccess: (memory) => {
      queryClient.setQueryData(queryKeys.memory(id), memory);
      queryClient.invalidateQueries({ queryKey: queryKeys.memoriesFeed });
      queryClient.invalidateQueries({ queryKey: ["memories", "map"] });
      queryClient.invalidateQueries({ queryKey: ["memories", "friends-map"] });
    },
  });
}

// --- Notification preferences & push token -----------------------------

export function useNotificationPreferencesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.notificationPreferences,
    queryFn: notificationsApi.getNotificationPreferences,
    enabled,
  });
}

export function useUpdateNotificationPreferencesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<NotificationPreferences>) =>
      notificationsApi.updateNotificationPreferences(patch),
    onMutate: async (patch) => {
      const key = queryKeys.notificationPreferences;
      await queryClient.cancelQueries({ queryKey: key });
      const previous =
        queryClient.getQueryData<NotificationPreferences>(key);
      if (previous) {
        queryClient.setQueryData<NotificationPreferences>(key, {
          ...previous,
          ...patch,
        });
      }
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.notificationPreferences,
          context.previous,
        );
      }
    },
    onSuccess: (prefs) => {
      queryClient.setQueryData(queryKeys.notificationPreferences, prefs);
    },
  });
}

export function useRegisterDeviceTokenMutation() {
  return useMutation({
    mutationFn: (input: { token: string; platform: DevicePlatform }) =>
      notificationsApi.registerDeviceToken(input.token, input.platform),
  });
}
