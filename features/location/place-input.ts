import { createHoChiMinhCityPlace } from "@/features/location/fallback-places";
import type { PlaceInput, PlaceSuggestion } from "@/types/api";

export function placeSuggestionToPlaceInput(s: PlaceSuggestion): PlaceInput {
  const name = s.name?.trim() || "Ho Chi Minh City";
  const formattedAddress = s.address?.trim() || "Ho Chi Minh City, Vietnam";
  const latitude = Number(s.latitude);
  const longitude = Number(s.longitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !name ||
    !formattedAddress
  ) {
    return placeSuggestionToPlaceInput(createHoChiMinhCityPlace({ name }));
  }

  return {
    externalPlaceId: s.placeId,
    name,
    formattedAddress,
    latitude,
    longitude,
    types: [],
  };
}
