import { useCallback, useState } from "react";

import {
  getCurrentCoordinates,
  type Coordinates,
} from "@/features/location/get-current-coordinates";

export function useCurrentLocation() {
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPermissionDenied(false);

    try {
      const result = await getCurrentCoordinates();
      if (!result.ok) {
        if (result.reason === "permission_denied") {
          setPermissionDenied(true);
          setError("Location permission denied");
        } else {
          setError("Could not get location");
        }
        setCoords(null);
        return;
      }
      setCoords(result.coords);
    } catch {
      setError("Could not get location");
      setCoords(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { coords, loading, error, permissionDenied, refresh };
}
