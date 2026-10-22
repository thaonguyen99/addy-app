import { StyleProp, Text, View, ViewStyle } from "react-native";

import { BrandColors } from "@/constants/theme";
import { MOOD_SCORE_OPTIONS } from "@/features/camera/constants/mood-score";

type MapMoodStickerProps = {
  /** Not yet sent by the map-pin endpoints — stays hidden until it is. */
  moodScore?: number | null;
  /** Tilt in degrees, e.g. a hash-derived value in roughly [-10, 10]. */
  tiltDeg?: number;
  style?: StyleProp<ViewStyle>;
};

/** The memory's mood as a bare, tilted emoji sticker beside the map pin. */
export function MapMoodSticker({
  moodScore,
  tiltDeg = -8,
  style,
}: MapMoodStickerProps) {
  if (moodScore == null) return null;

  const emoji = MOOD_SCORE_OPTIONS.find((o) => o.score === moodScore)?.emoji;
  if (!emoji) return null;

  return (
    <View
      style={[
        {
          transform: [{ rotate: `${tiltDeg}deg` }],
          shadowColor: BrandColors.ink,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          elevation: 3,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: 28 }}>{emoji}</Text>
    </View>
  );
}
