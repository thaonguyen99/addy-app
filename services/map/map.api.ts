import type { StyleSpecification } from "@maplibre/maplibre-react-native";

import { GOONG_MAP_API_KEY } from "@/lib/env";
import { restyleGoongMap } from "@/utils/addy-map-style";

export const GOONG_STYLE_URL = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAP_API_KEY}`;

async function fetchAddyMapStyle(): Promise<StyleSpecification> {
  const response = await fetch(GOONG_STYLE_URL);
  if (!response.ok) throw new Error(`Map style ${response.status}`);
  return restyleGoongMap((await response.json()) as StyleSpecification);
}

export const mapApi = {
  fetchAddyMapStyle,
};
