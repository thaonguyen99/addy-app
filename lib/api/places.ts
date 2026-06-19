import { apiGet } from "@/lib/api/client";
import type { PlaceRecord, PlaceSuggestion, ReverseGeocodeResult } from "@/types/api";

export async function fetchNearbyPlaces(
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

export async function fetchPlaceSearch(
  q: string,
  lat?: number,
  lng?: number,
): Promise<PlaceSuggestion[]> {
  return apiGet<PlaceSuggestion[]>("/places/search", {
    q,
    ...(lat !== undefined && lng !== undefined ? { lat, lng } : {}),
  });
}

export async function resolvePlace(placeId: string): Promise<PlaceRecord> {
  return apiGet<PlaceRecord>("/places/resolve", { placeId });
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  return apiGet<ReverseGeocodeResult>("/places/reverse-geocode", { lat, lng });
}
