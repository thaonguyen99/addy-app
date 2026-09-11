import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { BrandColors } from "@/constants/theme";
import { POLAROID } from "@/features/feed/utils/polaroid";

const pinImage = require("@/assets/images/pin.png");

type PolaroidMapMarkerProps = {
  imageUrl: string;
  /** When more than one memory shares this place, shows a "+N" corner badge. */
  count?: number;
  /** Tints the pin icon to distinguish a friend's memory from your own. */
  isFriend?: boolean;
};

export function PolaroidMapMarker({
  imageUrl,
  count,
  isFriend,
}: PolaroidMapMarkerProps) {
  return (
    <View style={styles.wrapper}>
      <Image
        source={pinImage}
        style={styles.pinIcon}
        contentFit="contain"
        tintColor={isFriend ? BrandColors.primary : undefined}
      />
      <View style={styles.polaroid}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.photo}
          contentFit="cover"
        />
      </View>
      {count != null && count > 1 ? (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>+{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

const PHOTO_SIZE = 56;
const POLAROID_PADDING = 5;
const POLAROID_BOTTOM = 10;
const POLAROID_WIDTH = PHOTO_SIZE + POLAROID_PADDING * 2;
const POLAROID_HEIGHT = PHOTO_SIZE + POLAROID_PADDING + POLAROID_BOTTOM;

const PIN_SIZE = 28;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
  },
  pinIcon: {
    width: PIN_SIZE,
    height: PIN_SIZE,
    marginBottom: -6,
    zIndex: 2,
  },
  polaroid: {
    width: POLAROID_WIDTH,
    height: POLAROID_HEIGHT,
    backgroundColor: POLAROID.frameColor,
    padding: POLAROID_PADDING,
    paddingBottom: POLAROID_BOTTOM,
    borderRadius: 2,
    ...POLAROID.shadow,
    transform: [{ rotate: "-3deg" }],
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 1,
    backgroundColor: BrandColors.neutralBorder,
  },
  countBadge: {
    position: "absolute",
    top: PIN_SIZE - 10,
    right: -6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    backgroundColor: BrandColors.primary,
    borderWidth: 1.5,
    borderColor: BrandColors.white,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  countBadgeText: {
    color: BrandColors.white,
    fontSize: 11,
    fontWeight: "700",
  },
});
