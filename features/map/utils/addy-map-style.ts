import type { StyleSpecification } from "@maplibre/maplibre-react-native";
import { useQuery } from "@tanstack/react-query";

import { AddyColors } from "@/constants/theme";
import { GOONG_MAP_API_KEY } from "@/lib/env";

export const GOONG_STYLE_URL = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAP_API_KEY}`;

type Layer = StyleSpecification["layers"][number];

const ROAD_PREFIXES = ["road-", "bridge-", "tunnel-"];
const ROAD_CASE_COLOR = "#DCDFE8";
const PARK_COLOR = "#DCEFD6";
const WATER_COLOR = "#BFE3F7";
const BUILDING_COLOR = "#E2E4EA";

function hide(layer: Layer): Layer {
  return { ...layer, layout: { ...layer.layout, visibility: "none" } } as Layer;
}

function paint(layer: Layer, overrides: Record<string, unknown>): Layer {
  return { ...layer, paint: { ...layer.paint, ...overrides } } as Layer;
}

/**
 * Pale Addy base map on top of Goong's style, matched by Goong's layer ids:
 * mapBg background, white roads with faint casings, no POI icons, flat
 * buildings. Layers it doesn't recognize pass through unchanged.
 */
export function restyleGoongMap(style: StyleSpecification): StyleSpecification {
  const layers = style.layers.map((layer): Layer => {
    const { id, type } = layer;

    if (id === "background") {
      return paint(layer, { "background-color": AddyColors.mapBg });
    }
    if (id.startsWith("poi-") || id.startsWith("road-oneway")) {
      return hide(layer);
    }
    if (type === "fill-extrusion") return hide(layer);
    if (id === "building_flat") {
      return paint(layer, { "fill-color": BUILDING_COLOR, "fill-opacity": 0.7 });
    }
    if (id === "water" || id === "ocean") {
      return paint(layer, { "fill-color": WATER_COLOR });
    }
    if (id === "water-shadow") return hide(layer);
    if (id === "park" || id === "landuser-park" || id === "landuser-grass") {
      return paint(layer, { "fill-color": PARK_COLOR, "fill-opacity": 0.8 });
    }
    if (id.startsWith("landuse-") || id.startsWith("landcover-")) {
      return paint(layer, { "fill-color": AddyColors.mapBg });
    }
    if (type === "line" && ROAD_PREFIXES.some((p) => id.startsWith(p))) {
      return paint(layer, {
        "line-color": id.includes("-case") ? ROAD_CASE_COLOR : AddyColors.white,
      });
    }
    return layer;
  });

  return { ...style, layers };
}

async function fetchAddyMapStyle(): Promise<StyleSpecification> {
  const response = await fetch(GOONG_STYLE_URL);
  if (!response.ok) throw new Error(`Map style ${response.status}`);
  return restyleGoongMap((await response.json()) as StyleSpecification);
}

/**
 * The restyled base map. `null` while the first fetch is in flight; on
 * failure it falls back to Goong's own style URL so the map still renders.
 */
export function useAddyMapStyle(): StyleSpecification | string | null {
  const { data, isError } = useQuery({
    queryKey: ["map", "style", "goong"],
    queryFn: fetchAddyMapStyle,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
  if (data) return data;
  return isError ? GOONG_STYLE_URL : null;
}
