import { memo, useMemo } from "react";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";

import { PIN_PATH } from "@/components/ui/photo-pin";
import { AddyColors, PIN_COLOR } from "@/constants/theme";
import { hashString } from "@/lib/stable-hash";

const VIEW_W = 300;
const VIEW_H = 180;
const PIN_SCALE = 0.22; // 100x128 pin path → ~22x28

type MiniPinMapProps = {
  /** One color per pin — only colors, never photos or place names, so this
   *  is safe to post publicly even when memories are private. */
  colors: readonly string[];
  /** Seed for where the pins land, e.g. the username. */
  seed: string;
  width: number;
  height: number;
  radius?: number;
};

const ROADS = [
  "M-10 120 C 60 100, 120 140, 310 90",
  "M70 -10 C 90 60, 60 120, 110 190",
  "M190 -10 C 180 70, 230 120, 210 190",
  "M-10 40 C 80 55, 200 20, 310 45",
];

/** A tiny stylised map dotted with pins in the given colors. */
export const MiniPinMap = memo(function MiniPinMap({
  colors,
  seed,
  width,
  height,
  radius = 14,
}: MiniPinMapProps) {
  const pins = useMemo(() => {
    // An empty map looks broken — fall back to a few default pins.
    const palette =
      colors.length > 0 ? colors.slice(0, 14) : Array(4).fill(PIN_COLOR);
    return palette.map((color, i) => {
      const h = hashString(`${seed}:${i}`);
      return {
        color,
        x: 24 + (h % (VIEW_W - 48)),
        y: 34 + ((h >>> 9) % (VIEW_H - 50)),
      };
    });
  }, [colors, seed]);

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <Rect
        x={0}
        y={0}
        width={VIEW_W}
        height={VIEW_H}
        rx={radius}
        fill={AddyColors.mapBg}
      />
      {ROADS.map((d) => (
        <Path
          key={d}
          d={d}
          stroke={AddyColors.white}
          strokeWidth={9}
          fill="none"
          strokeLinecap="round"
        />
      ))}
      <Rect x={226} y={120} width={52} height={36} rx={10} fill="#DCEFD6" />
      {pins.map((pin, i) => (
        <G
          key={i}
          transform={`translate(${pin.x - 50 * PIN_SCALE} ${pin.y - 122 * PIN_SCALE}) scale(${PIN_SCALE})`}
        >
          <Path
            d={PIN_PATH}
            fill="#16171A"
            fillOpacity={0.12}
            transform="translate(0 6)"
          />
          <Path d={PIN_PATH} fill={pin.color} />
          <Circle cx={50} cy={48} r={22} fill={AddyColors.white} />
        </G>
      ))}
    </Svg>
  );
});
