import { useEffect, useState } from "react";

import type { Coordinates } from "@/features/location/get-current-coordinates";
import { reverseGeocode } from "@/lib/api/places";
import type { PlaceSuggestion } from "@/types/api";

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
        const result = await reverseGeocode(lat, lng);
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
