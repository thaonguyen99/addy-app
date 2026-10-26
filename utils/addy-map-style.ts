import type { StyleSpecification } from "@maplibre/maplibre-react-native";

import { AddyColors } from "@/constants/theme";

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
