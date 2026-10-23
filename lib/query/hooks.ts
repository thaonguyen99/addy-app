import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as authApi from "@/lib/api/auth";
import { uploadAvatar, uploadImage } from "@/lib/api/media";
import * as memoriesApi from "@/lib/api/memories";
import { fetchNearbyPlaces } from "@/lib/api/places";
import * as usersApi from "@/lib/api/users";
import { useAuthStore } from "@/features/auth/store/auth-store";
import type { Coordinates } from "@/features/location/get-current-coordinates";
import { mapBoundsKey, queryKeys } from "@/lib/query/keys";
import type { MapBounds } from "@/types/api";

export * from "@/lib/query/hooks-social";
export * from "@/lib/query/hooks-messages";

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

export function useDeleteMemoryMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => memoriesApi.deleteMemory(id),
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

/** One memory as shown in a map cluster picker. */
export type ClusterMemory = { id: string; imageUrl: string; capturedAt: string };

/**
 * Every memory inside a group of map pins, newest first. A pin that stands
 * for several memories at one place is expanded via its place's list; a
 * single-memory pin is used as-is.
 */
export function useClusterMemoriesQuery(
  pins: readonly { id: string; placeId: string; imageUrl: string; capturedAt: string; memoryCount: number }[],
) {
  const multi = pins.filter((pin) => pin.memoryCount > 1);
  const results = useQueries({
    queries: multi.map((pin) => ({
      queryKey: queryKeys.placeMemories(pin.placeId),
      queryFn: () => memoriesApi.getPlaceMemories(pin.placeId),
    })),
  });

  const memories = new Map<string, ClusterMemory>();
  for (const pin of pins) {
    if (pin.memoryCount <= 1) {
      memories.set(pin.id, { id: pin.id, imageUrl: pin.imageUrl, capturedAt: pin.capturedAt });
    }
  }
  results.forEach((result, i) => {
    const place = result.data;
    if (!place) {
      // Until the place list loads (or if it fails), show its cover pin.
      const pin = multi[i];
      if (result.isError) {
        memories.set(pin.id, { id: pin.id, imageUrl: pin.imageUrl, capturedAt: pin.capturedAt });
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
