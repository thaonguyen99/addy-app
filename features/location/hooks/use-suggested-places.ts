import { useMemo } from "react";

import type { Coordinates } from "@/features/location/get-current-coordinates";
import { useNearbyPlacesQuery } from "@/lib/query/hooks";

/** Nearby places from GET /places/nearby (empty while Google Places is bypassed). */
export function useSuggestedPlaces(coords: Coordinates | null) {
  const nearbyQuery = useNearbyPlacesQuery(coords);

  return useMemo(
    () => ({
      places: nearbyQuery.data ?? [],
      loading: nearbyQuery.isLoading,
      sectionLabel: "Nearby" as const,
      isError: nearbyQuery.isError,
      refetch: nearbyQuery.refetch,
    }),
    [
      nearbyQuery.data,
      nearbyQuery.isLoading,
      nearbyQuery.isError,
      nearbyQuery.refetch,
    ],
  );
}
