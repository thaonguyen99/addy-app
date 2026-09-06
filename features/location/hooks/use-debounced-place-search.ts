import { useEffect, useState } from "react";

import { fetchPlaceSearch } from "@/lib/api/places";
import { toApiClientError } from "@/lib/api/errors";
import type { Coordinates } from "@/features/location/get-current-coordinates";
import { HCM_COORDINATES } from "@/features/location/fallback-places";
import type { PlaceSuggestion } from "@/types/api";

const DEBOUNCE_MS = 350;
const MIN_QUERY_LENGTH = 2;

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
        const data = await fetchPlaceSearch(
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
