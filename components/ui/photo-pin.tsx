import { StyleProp, View, ViewStyle } from "react-native";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Image,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

import { BrandColors } from "@/constants/theme";

// 100x128 viewBox reference teardrop path — the one consistent pin
// silhouette.
const PIN_PATH =
  "M50,4 C25,4 4,24 4,49 C4,74 50,122 50,122 C50,122 96,74 96,49 C96,24 75,4 50,4 Z";
const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 128;

// The photo sits as an inset circle within the teardrop's bulb, ringed in
// white so it reads against any pin color.
const PHOTO_CIRCLE_CX = 50;
const PHOTO_CIRCLE_CY = 48;
const PHOTO_CIRCLE_R = 40;
const PHOTO_RING_WIDTH = 4.7; // ~3px at the default 64px pin size

// Fake blur for the soft shadow: stacked, offset, fading-out copies of the
// body path. SVG has no native blur filter support on native, and RN's View
// shadow props only rasterize to a view's bounding box (not an SVG path's
// silhouette) on Android — so the blur has to be drawn as geometry instead.
const SHADOW_LAYERS = [
  { dy: 8, opacity: 0.03 },
  { dy: 6, opacity: 0.06 },
  { dy: 4, opacity: 0.09 },
  { dy: 2, opacity: 0.12 },
];

type PhotoPinProps = {
  /** Cover photo URL — a neutral gradient shows while missing/loading. */
  uri?: string;
  size?: number;
  pinColor: string;
  style?: StyleProp<ViewStyle>;
};

/** The core map/memory visual motif: a photo inset into a solid-color teardrop pin. */
export function PhotoPin({ uri, size = 64, pinColor, style }: PhotoPinProps) {
  const height = (size / VIEWBOX_WIDTH) * VIEWBOX_HEIGHT;

  return (
    <View style={[{ width: size, height }, style]}>
      <Svg
        width={size}
        height={height}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      >
        <Defs>
          <ClipPath id="photoClip">
            <Circle
              cx={PHOTO_CIRCLE_CX}
              cy={PHOTO_CIRCLE_CY}
              r={PHOTO_CIRCLE_R}
            />
          </ClipPath>
          <LinearGradient id="photoFallback" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={BrandColors.gray200} />
            <Stop offset="1" stopColor={BrandColors.gray300} />
          </LinearGradient>
        </Defs>

        {/* Soft shadow, drawn first so it sits beneath everything else. */}
        {SHADOW_LAYERS.map(({ dy, opacity }) => (
          <Path
            key={dy}
            d={PIN_PATH}
            fill={BrandColors.ink}
            fillOpacity={opacity}
            transform={`translate(0, ${dy})`}
          />
        ))}

        {/* Solid-color teardrop body. */}
        <Path d={PIN_PATH} fill={pinColor} />

        {/* Photo, inset as a ringed circle — gradient shows under/instead of
            a missing or still-loading image. */}
        <Circle
          cx={PHOTO_CIRCLE_CX}
          cy={PHOTO_CIRCLE_CY}
          r={PHOTO_CIRCLE_R}
          fill="url(#photoFallback)"
        />
        {uri ? (
          // TODO: swap for a Cloudinary thumbnail transform once `uri`'s
          // format is confirmed — no such helper exists yet, so this is
          // used as-is today.
          <Image
            href={{ uri }}
            x={PHOTO_CIRCLE_CX - PHOTO_CIRCLE_R}
            y={PHOTO_CIRCLE_CY - PHOTO_CIRCLE_R}
            width={PHOTO_CIRCLE_R * 2}
            height={PHOTO_CIRCLE_R * 2}
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#photoClip)"
          />
        ) : null}

        {/* White ring around the photo. */}
        <Circle
          cx={PHOTO_CIRCLE_CX}
          cy={PHOTO_CIRCLE_CY}
          r={PHOTO_CIRCLE_R}
          fill="none"
          stroke={BrandColors.white}
          strokeWidth={PHOTO_RING_WIDTH}
        />
      </Svg>
    </View>
  );
}
