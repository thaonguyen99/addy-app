import { StyleProp, Text, View, ViewStyle } from "react-native";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  Image,
  Path,
} from "react-native-svg";

import { BrandColors } from "@/constants/theme";

// 100x128 viewBox reference teardrop path — the one consistent pin
// silhouette; category is shown via the corner badge only, never a shape
// change.
const PIN_PATH =
  "M50,4 C25,4 4,24 4,49 C4,74 50,122 50,122 C50,122 96,74 96,49 C96,24 75,4 50,4 Z";
const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 128;

// The photo sits as an inset circle within the teardrop's bulb, leaving a
// visible paper margin — it never fills the silhouette edge-to-edge.
const PHOTO_CIRCLE_CX = 50;
const PHOTO_CIRCLE_CY = 48;
const PHOTO_CIRCLE_R = 34;

type PhotoPinProps = {
  uri: string;
  size?: number;
  /** Category badge — omit for the plain pin (the common case). */
  badgeEmoji?: string;
  badgeColor?: string;
  style?: StyleProp<ViewStyle>;
};

/** The core map/memory visual motif: a photo inset into a paper teardrop pin. */
export function PhotoPin({
  uri,
  size = 100,
  badgeEmoji,
  badgeColor = BrandColors.accentCyan,
  style,
}: PhotoPinProps) {
  const height = (size / VIEWBOX_WIDTH) * VIEWBOX_HEIGHT;
  const badgeSize = Math.round(size * 0.24);

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
        </Defs>

        {/* Hard shadow — drawn first so it sits beneath everything else. */}
        <Path d={PIN_PATH} fill={BrandColors.ink} transform="translate(3, 3)" />

        {/* Paper teardrop body. */}
        <Path d={PIN_PATH} fill={BrandColors.paper} />

        {/* Photo, inset as a circle with a visible paper margin. */}
        <Image
          href={{ uri }}
          x={PHOTO_CIRCLE_CX - PHOTO_CIRCLE_R}
          y={PHOTO_CIRCLE_CY - PHOTO_CIRCLE_R}
          width={PHOTO_CIRCLE_R * 2}
          height={PHOTO_CIRCLE_R * 2}
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#photoClip)"
        />

        {/* Decorative gloss highlight on the photo circle. */}
        <Ellipse
          cx={38}
          cy={32}
          rx={10}
          ry={6}
          fill="#FFFFFF"
          fillOpacity={0.55}
          transform="rotate(-25 38 32)"
        />

        {/* Outline stroke on top. */}
        <Path
          d={PIN_PATH}
          fill="none"
          stroke={BrandColors.ink}
          strokeWidth={4.5}
          strokeLinejoin="round"
        />
      </Svg>

      {badgeEmoji ? (
        <View
          style={{
            position: "absolute",
            right: -badgeSize * 0.15,
            bottom: height * 0.28,
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            borderWidth: 2.5,
            borderColor: BrandColors.ink,
            backgroundColor: badgeColor,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: badgeSize * 0.55 }}>{badgeEmoji}</Text>
        </View>
      ) : null}
    </View>
  );
}
