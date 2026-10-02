import type { Coordinates } from "@/features/location/get-current-coordinates";
import type { PlaceSuggestion } from "@/types/api";

/** Stable manual id so repeated dev pins upsert the same place row. */
export const HCM_MANUAL_PLACE_ID = "manual:hcmc-vietnam";

export const HCM_COORDINATES: Coordinates = {
  latitude: 10.7769,
  longitude: 106.7009,
};

const UNRESOLVED_PLACE_PREFIX = "unresolved:";
export const UNRESOLVED_PLACE_NAME = "Unnamed place";

/**
 * The user's GPS position when it can't be turned into a named place yet
 * (offline). The offline pin queue resolves the name when it uploads.
 */
export function createUnresolvedPlace(coords: Coordinates): PlaceSuggestion {
  return {
    placeId: `${UNRESOLVED_PLACE_PREFIX}${coords.latitude},${coords.longitude}`,
    name: UNRESOLVED_PLACE_NAME,
    address: "Place name is filled in once you're back online",
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}

export function isUnresolvedPlace(place: PlaceSuggestion): boolean {
  return place.placeId.startsWith(UNRESOLVED_PLACE_PREFIX);
}

export function createHoChiMinhCityPlace(options?: {
  name?: string;
  placeId?: string;
}): PlaceSuggestion {
  const trimmedName = options?.name?.trim();

  return {
    placeId: options?.placeId ?? HCM_MANUAL_PLACE_ID,
    name: trimmedName || "Ho Chi Minh City",
    address: "Ho Chi Minh City, Vietnam",
    latitude: HCM_COORDINATES.latitude,
    longitude: HCM_COORDINATES.longitude,
  };
}
