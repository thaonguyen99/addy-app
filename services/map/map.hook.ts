import type { StyleSpecification } from "@maplibre/maplibre-react-native";
import { useQuery } from "@tanstack/react-query";

import { GOONG_STYLE_URL, mapApi } from "./map.api";

/**
 * The restyled base map. `null` while the first fetch is in flight; on
 * failure it falls back to Goong's own style URL so the map still renders.
 */
export function useAddyMapStyle(): StyleSpecification | string | null {
  const { data, isError } = useQuery({
    queryKey: ["map", "style", "goong"],
    queryFn: mapApi.fetchAddyMapStyle,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
  if (data) return data;
  return isError ? GOONG_STYLE_URL : null;
}
