import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { invalidateSocialLists } from "@/services/friends";
import { queryKeys } from "@/services/query/keys";
import { socialApi } from "./social.api";

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

export function useInvitePreviewQuery(token: string | undefined) {
  return useQuery({
    queryKey: ["invites", "preview", token ?? ""],
    queryFn: () => socialApi.getInvitePreview(token!),
    enabled: Boolean(token),
    retry: false,
  });
}

/** Opening someone's link or QR: friends straight away, no request. */
export function useAcceptInviteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => socialApi.acceptInvite(token),
    onSuccess: () => {
      invalidateSocialLists(queryClient);
      queryClient.invalidateQueries({ queryKey: ["invites", "preview"] });
    },
  });
}

/**
 * A block/unblock changes what the server shows everywhere: it ends the
 * friendship, hides (or restores) the person's messages, likes and reactions,
 * and flips their relationship back to "none". Refetch all of it so the change
 * shows up without an app restart.
 */
function invalidateAfterBlockChange(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  invalidateSocialLists(queryClient);
  queryClient.invalidateQueries({ queryKey: ["invites", "preview"] });
  queryClient.invalidateQueries({ queryKey: ["memories", "messages"] });
  queryClient.invalidateQueries({ queryKey: ["memories", "detail"] });
  queryClient.invalidateQueries({ queryKey: ["memories", "reactions"] });
  queryClient.invalidateQueries({ queryKey: queryKeys.memoriesFeed });
  queryClient.invalidateQueries({ queryKey: ["memories", "place"] });
}

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
    onSuccess: () => invalidateAfterBlockChange(queryClient),
  });
}

export function useUnblockUserMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => socialApi.unblockUser(userId),
    onSuccess: () => invalidateAfterBlockChange(queryClient),
  });
}
