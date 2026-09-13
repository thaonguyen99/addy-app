import { StyleProp, Text, View, ViewStyle } from "react-native";
import Svg, { ClipPath, Defs, Ellipse, Image, Path } from "react-native-svg";

import { BrandColors } from "@/constants/theme";

// 100x128 viewBox reference teardrop path — the one consistent pin
// silhouette; category is shown via the corner badge only, never a shape
// change.
const PIN_PATH =
  "M50,4 C25,4 4,24 4,49 C4,74 50,122 50,122 C50,122 96,74 96,49 C96,24 75,4 50,4 Z";
const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 128;

type PhotoPinProps = {
  uri: string;
  size?: number;
  badgeEmoji?: string;
  badgeColor?: string;
  style?: StyleProp<ViewStyle>;
};

/** The core map/memory visual motif: a photo clipped into a teardrop pin. */
export function PhotoPin({
  uri,
  size = 100,
  badgeEmoji = "📍",
  badgeColor = BrandColors.accentCyan,
  style,
}: PhotoPinProps) {
  const height = (size / VIEWBOX_WIDTH) * VIEWBOX_HEIGHT;
  const badgeSize = Math.round(size * 0.24);

  return (
    <View style={[{ width: size, height }, style]}>
      <Svg width={size} height={height} viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
        <Defs>
          <ClipPath id="pinClip">
            <Path d={PIN_PATH} />
          </ClipPath>
        </Defs>

        {/* Hard shadow — drawn first so it sits beneath everything else. */}
        <Path d={PIN_PATH} fill={BrandColors.ink} transform="translate(3, 3)" />

        {/* Photo, clipped to the exact teardrop shape (tip included). */}
        <Image
          href={{ uri }}
          x={0}
          y={0}
          width={VIEWBOX_WIDTH}
          height={VIEWBOX_HEIGHT}
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#pinClip)"
        />

        {/* Decorative gloss highlight. */}
        <Ellipse
          cx={32}
          cy={30}
          rx={14}
          ry={8}
          fill="#FFFFFF"
          fillOpacity={0.35}
          transform="rotate(-25 32 30)"
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
    </View>
  );
}
