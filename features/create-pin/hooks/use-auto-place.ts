import { useEffect } from "react";

import { useCreatePinHandoffStore } from "@/features/create-pin/store/create-pin-handoff-store";
import { createUnresolvedPlace } from "@/features/location/fallback-places";
import { useCurrentLocation } from "@/features/location/hooks/use-current-location";
import { useReverseGeocodedPlace } from "@/features/location/hooks/use-reverse-geocoded-place";

/**
 * Prefills the draft's place from the device location (reverse-geocoded),
 * for as long as the user hasn't picked one in the place picker. Offline it
 * falls back to an unnamed place at the GPS fix; the pin queue names it on
 * upload.
 */
export function useAutoPlace() {
  const { coords, error, permissionDenied, refresh } = useCurrentLocation();
  const { place, loading: geocoding } = useReverseGeocodedPlace(coords);
  const placeSource = useCreatePinHandoffStore((s) => s.placeSource);
  const setPlace = useCreatePinHandoffStore((s) => s.setPlace);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const auto =
    place ?? (coords && !geocoding ? createUnresolvedPlace(coords) : null);

  useEffect(() => {
    if (placeSource === "auto") setPlace(auto, "auto");
    // `auto` is rebuilt each render; its identity only matters via these.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeSource, place, coords, geocoding, setPlace]);

  return {
    /** Still waiting on GPS or the reverse geocode. */
    resolving: !error && !permissionDenied && (!coords || geocoding),
    /** No location available (denied or failed) — the user must pick one. */
    unavailable: permissionDenied || (!!error && !coords),
  };
}
