import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as authApi from "@/lib/api/auth";
import { uploadImage, uploadImages } from "@/lib/api/media";
import * as memoriesApi from "@/lib/api/memories";
import { fetchNearbyPlaces } from "@/lib/api/places";
import * as usersApi from "@/lib/api/users";
import type { Coordinates } from "@/features/location/get-current-coordinates";
import { mapBoundsKey, queryKeys } from "@/lib/query/keys";
import type { CreateMemoryInput, MapBounds } from "@/types/api";

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
      queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
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

export function useProfileQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: usersApi.getProfile,
    enabled,
  });
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
