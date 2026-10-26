import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/services/query/keys";
import { useAuthStore } from "@/stores/auth.store";
import { userApi } from "./users.api";

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
