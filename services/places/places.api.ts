import { apiGet } from "@/services/api/client";
import type { PlaceRecord, PlaceSuggestion, ReverseGeocodeResult } from "./places.type";

async function fetchNearbyPlaces(
  lat: number,
  lng: number,
  radius?: number,
): Promise<PlaceSuggestion[]> {
  return apiGet<PlaceSuggestion[]>("/places/nearby", {
    lat,
    lng,
    ...(radius !== undefined ? { radius } : {}),
  });
}

async function fetchPlaceSearch(
  q: string,
  lat?: number,
  lng?: number,
): Promise<PlaceSuggestion[]> {
  return apiGet<PlaceSuggestion[]>("/places/search", {
    q,
    ...(lat !== undefined && lng !== undefined ? { lat, lng } : {}),
  });
}

async function resolvePlace(placeId: string): Promise<PlaceRecord> {
  return apiGet<PlaceRecord>("/places/resolve", { placeId });
}

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  return apiGet<ReverseGeocodeResult>("/places/reverse-geocode", { lat, lng });
}

export const placeApi = {
  fetchNearbyPlaces,
  fetchPlaceSearch,
  resolvePlace,
  reverseGeocode,
};
