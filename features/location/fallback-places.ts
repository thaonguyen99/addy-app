import type { Coordinates } from "@/features/location/get-current-coordinates";
import type { PlaceSuggestion } from "@/types/api";

/** Stable manual id so repeated dev pins upsert the same place row. */
export const HCM_MANUAL_PLACE_ID = "manual:hcmc-vietnam";

export const HCM_COORDINATES: Coordinates = {
  latitude: 10.7769,
  longitude: 106.7009,
};

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
