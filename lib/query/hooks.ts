import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as authApi from "@/lib/api/auth";
import { uploadAvatar, uploadImage, uploadImages } from "@/lib/api/media";
import * as memoriesApi from "@/lib/api/memories";
import { fetchNearbyPlaces } from "@/lib/api/places";
import * as usersApi from "@/lib/api/users";
import { useAuthStore } from "@/features/auth/store/auth-store";
import type { Coordinates } from "@/features/location/get-current-coordinates";
import { mapBoundsKey, queryKeys } from "@/lib/query/keys";
import type { CreateMemoryInput, MapBounds } from "@/types/api";

export * from "@/lib/query/hooks-social";

export function useRegisterMutation() {
  return useMutation({ mutationFn: authApi.register });
}

export function useVerifyOtpMutation() {
  return useMutation({ mutationFn: authApi.verifyOtp });
}

export function useResendOtpMutation() {
  return useMutation({ mutationFn: authApi.resendOtp });
}

export function useLoginMutation() {
  return useMutation({ mutationFn: authApi.login });
}

export function useForgotPasswordMutation() {
  return useMutation({ mutationFn: authApi.forgotPassword });
}

export function useResetPasswordMutation() {
  return useMutation({ mutationFn: authApi.resetPassword });
}

export function useGoogleSignInMutation() {
  return useMutation({ mutationFn: authApi.googleSignIn });
}

export function useUploadImageMutation() {
  return useMutation({ mutationFn: uploadImage });
}

export function useUploadImagesMutation() {
  return useMutation({ mutationFn: uploadImages });
}

export function useCreateMemoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMemoryInput) => memoriesApi.createMemory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories", "map"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.memoriesFeed });
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}

/** Every memory the user has created, newest first — feeds the map drawer. */
export function useMemoriesFeedQuery(enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.memoriesFeed,
    queryFn: ({ pageParam }) =>
      memoriesApi.listMemories({ cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
  });
}

export function useMemoryQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.memory(id ?? ""),
    queryFn: () => memoriesApi.getMemory(id!),
    enabled: Boolean(id),
  });
}

export function useMemoriesMapQuery(bounds: MapBounds | null) {
  const key = bounds ? mapBoundsKey(bounds) : "idle";
  return useQuery({
    queryKey: queryKeys.map(key),
    queryFn: () => memoriesApi.getMapPins(bounds!),
    enabled: Boolean(bounds),
  });
}

export function usePlaceMemoriesQuery(placeId: string | null) {
  return useQuery({
    queryKey: queryKeys.placeMemories(placeId ?? "idle"),
    queryFn: () => memoriesApi.getPlaceMemories(placeId!),
    enabled: Boolean(placeId),
  });
}

export function useProfileQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: usersApi.getProfile,
    enabled,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: usersApi.updateProfile,
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
    mutationFn: usersApi.completeOnboarding,
    onSuccess: async (profile) => {
      await updateUser({ onboardingCompletedAt: profile.onboardingCompletedAt });
      queryClient.setQueryData(queryKeys.profile, profile);
    },
  });
}

export function useDeleteAccountMutation() {
  return useMutation({ mutationFn: usersApi.deleteAccount });
}

export function useUploadAvatarMutation() {
  return useMutation({ mutationFn: uploadAvatar });
}

export function useChangePasswordMutation() {
  const updateTokens = useAuthStore((s) => s.updateTokens);
  return useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: async ({ tokens }) => {
      await updateTokens(tokens);
    },
  });
}

export function useCheckUsernameMutation() {
  return useMutation({ mutationFn: usersApi.checkUsernameAvailable });
}

export function useStatsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: usersApi.getStats,
    enabled,
  });
}

export function useNearbyPlacesQuery(coords: Coordinates | null) {
  return useQuery({
    queryKey: coords
      ? queryKeys.placesNearby(coords.latitude, coords.longitude)
      : ["places", "nearby", "idle"],
    queryFn: () => fetchNearbyPlaces(coords!.latitude, coords!.longitude),
    enabled: Boolean(coords),
    staleTime: 60_000,
  });
}
