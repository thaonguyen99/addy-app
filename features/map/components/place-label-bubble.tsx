import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

import { SoftShadowBox } from "@/components/ui/soft-shadow";
import { MAP_LABEL_NAVY } from "@/constants/map-style";
import { AddyFonts, BrandColors } from "@/constants/theme";

const TAIL_WIDTH = 10;
const TAIL_HEIGHT = 6;
const MAX_WIDTH = 160;

type PlaceLabelBubbleProps = {
  /** Not yet sent by the map-pin endpoints — stays hidden until it is. */
  placeName?: string;
  /** Flips the bubble (and its tail) to grow left instead of right, so it
   *  doesn't run off the right edge of the screen. */
  flipped: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Speech-bubble place-name label shown above a map pin. */
export function PlaceLabelBubble({
  placeName,
  flipped,
  style,
}: PlaceLabelBubbleProps) {
  if (!placeName) return null;

  return (
    <View style={[{ alignItems: flipped ? "flex-end" : "flex-start" }, style]}>
      <SoftShadowBox radius={16} style={styles.bubble}>
        <Text numberOfLines={1} ellipsizeMode="tail" style={styles.text}>
          {placeName}
        </Text>
      </SoftShadowBox>
      <View
        style={[
          styles.tailWrap,
          flipped ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" },
        ]}
      >
        <Svg width={TAIL_WIDTH} height={TAIL_HEIGHT} viewBox="0 0 10 6">
          <Path d="M0,0 L10,0 L5,6 Z" fill={BrandColors.white} />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    backgroundColor: BrandColors.white,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  text: {
    maxWidth: MAX_WIDTH,
    fontSize: 12,
    fontFamily: AddyFonts.bodySemiBold,
    color: MAP_LABEL_NAVY,
  },
  tailWrap: {
    marginTop: -1,
    marginHorizontal: 16,
  },
});
