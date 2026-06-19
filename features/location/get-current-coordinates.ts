import * as Location from "expo-location";

export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type GetCurrentCoordinatesResult =
  | { ok: true; coords: Coordinates }
  | { ok: false; reason: "permission_denied" }
  | { ok: false; reason: "unavailable" };

export async function getCurrentCoordinates(): Promise<GetCurrentCoordinatesResult> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    return { ok: false, reason: "permission_denied" };
  }

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      ok: true,
      coords: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
    };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
