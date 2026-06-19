import * as Location from "expo-location";

import { createMemoryImageId } from "@/features/camera/utils/id";
import type { Coordinates } from "@/features/location/get-current-coordinates";
import type { PlaceSuggestion } from "@/types/api";

export function newManualPlaceId(): string {
  return `manual:${createMemoryImageId()}`;
}

export async function reverseGeocodeFormattedAddress(
  latitude: number,
  longitude: number,
): Promise<string> {
  try {
    const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (!geo) return "Unknown location";

    const parts = [
      geo.name,
      geo.street,
      geo.city,
      geo.region,
      geo.country,
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(", ") : "Unknown location";
  } catch {
    return "Unknown location";
  }
}

export async function buildPlaceFromCoordinates(
  coords: Coordinates,
  options?: { name?: string; placeId?: string },
): Promise<PlaceSuggestion> {
  const formattedAddress = await reverseGeocodeFormattedAddress(
    coords.latitude,
    coords.longitude,
  );

  const trimmedName = options?.name?.trim();

  return {
    placeId: options?.placeId ?? newManualPlaceId(),
    name: trimmedName || "Pinned location",
    address: formattedAddress,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}
