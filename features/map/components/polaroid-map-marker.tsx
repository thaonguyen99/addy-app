import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { BrandColors } from "@/constants/theme";
import { POLAROID } from "@/features/feed/utils/polaroid";

const pinImage = require("@/assets/images/pin.png");

type PolaroidMapMarkerProps = {
  imageUrl: string;
};

export function PolaroidMapMarker({ imageUrl }: PolaroidMapMarkerProps) {
  return (
    <View style={styles.wrapper}>
      <Image source={pinImage} style={styles.pinIcon} contentFit="contain" />
      <View style={styles.polaroid}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.photo}
          contentFit="cover"
        />
      </View>
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
});
