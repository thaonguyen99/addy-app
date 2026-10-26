import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { HCM_COORDINATES } from "@/features/location/fallback-places";
import type { Coordinates } from "@/features/location/get-current-coordinates";
import { toApiClientError } from "@/services/api/errors";
import { queryKeys } from "@/services/query/keys";
import { placeApi } from "./places.api";
import type { PlaceSuggestion } from "./places.type";

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

export function useNearbyPlacesQuery(coords: Coordinates | null) {
  return useQuery({
    queryKey: coords
      ? queryKeys.placesNearby(coords.latitude, coords.longitude)
      : ["places", "nearby", "idle"],
    queryFn: () =>
      placeApi.fetchNearbyPlaces(coords!.latitude, coords!.longitude),
    enabled: Boolean(coords),
    staleTime: 60_000,
  });
}

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

export function useDebouncedPlaceSearch(
  query: string,
  coords: Coordinates | null,
) {
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const bias = coords ?? HCM_COORDINATES;
        const data = await placeApi.fetchPlaceSearch(
          trimmed,
          bias.latitude,
          bias.longitude,
        );
        setResults(data);
      } catch (err) {
        setResults([]);
        setError(toApiClientError(err).message || "Search failed");
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, coords?.latitude, coords?.longitude]);

  return { results, loading, error };
}

/**
 * Turns the device's current coordinates into a concrete place (street-level,
 * via the server's Goong reverse-geocode) so it can be offered as the default
 * "where you are right now" suggestion.
 */
export function useReverseGeocodedPlace(coords: Coordinates | null): {
  place: PlaceSuggestion | null;
  loading: boolean;
} {
  const [place, setPlace] = useState<PlaceSuggestion | null>(null);
  const [loading, setLoading] = useState(false);

  const lat = coords?.latitude;
  const lng = coords?.longitude;

  useEffect(() => {
    if (lat === undefined || lng === undefined) {
      setPlace(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void (async () => {
      try {
        const result = await placeApi.reverseGeocode(lat, lng);
        if (cancelled) return;
        setPlace({
          placeId: result.externalPlaceId,
          name: result.name,
          address: result.formattedAddress,
          latitude: result.latitude,
          longitude: result.longitude,
        });
      } catch {
        if (!cancelled) setPlace(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return { place, loading };
}
