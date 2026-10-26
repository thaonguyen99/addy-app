import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { ApiClientError } from "@/services/api/errors";
import { queryKeys } from "@/services/query/keys";
import { useAuthStore } from "@/stores/auth.store";
import { userApi } from "./users.api";

/** Blocked-by-them, deleted and never-existed all come back as this 404. */
export function isUserNotFoundError(error: unknown): boolean {
  return error instanceof ApiClientError && error.code === "USER_NOT_FOUND";
}

/** Refetch every profile header and grid (after a profile edit or a new memory). */
export function invalidateUserProfiles(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: ["users", "profile"] });
  queryClient.invalidateQueries({ queryKey: ["users", "profile-memories"] });
}

export function useUserProfileQuery(username: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.userProfile(username),
    queryFn: () => userApi.getUserProfile(username),
    // A 404 won't change on retry; a network error might.
    retry: (count, error) => !isUserNotFoundError(error) && count < 1,
    enabled: enabled && username.length > 0,
  });
}

/** Only call this for yourself or a friend — anyone else gets a 403. */
export function useUserMemoriesQuery(username: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: queryKeys.userMemories(username),
    queryFn: ({ pageParam }) => userApi.listUserMemories(username, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    enabled,
  });
}

export function useProfileQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: userApi.getProfile,
    enabled,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: async (profile) => {
      await updateUser({
        username: profile.username,
        name: profile.name,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        hasPassword: profile.hasPassword,
      });
      queryClient.setQueryData(queryKeys.profile, profile);
      invalidateUserProfiles(queryClient);
    },
  });
}

export function useCompleteOnboardingMutation() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: userApi.completeOnboarding,
    onSuccess: async (profile) => {
      await updateUser({
        onboardingCompletedAt: profile.onboardingCompletedAt,
      });
      queryClient.setQueryData(queryKeys.profile, profile);
    },
  });
}

export function useDeleteAccountMutation() {
  return useMutation({ mutationFn: userApi.deleteAccount });
}

export function useChangePasswordMutation() {
  const updateTokens = useAuthStore((s) => s.updateTokens);
  return useMutation({
    mutationFn: userApi.changePassword,
    onSuccess: async ({ tokens }) => {
      await updateTokens(tokens);
    },
  });
}

export function useCheckUsernameMutation() {
  return useMutation({ mutationFn: userApi.checkUsernameAvailable });
}

export function useStatsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: userApi.getStats,
    enabled,
  });
}
