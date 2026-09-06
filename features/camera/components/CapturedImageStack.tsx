import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { BrandColors } from "@/constants/theme";
import {
  CAPTURE_STACK_OFFSET,
  CAPTURE_STACK_THUMB_SIZE,
  CAPTURE_STACK_VISIBLE_COUNT,
} from "@/features/camera/constants/layout";
import type { AddyMemoryImage } from "@/types/addy-memory";

export type CapturedImageStackProps = Readonly<{
  photos: readonly AddyMemoryImage[];
}>;

function CapturedImageStackInner({ photos }: CapturedImageStackProps) {
  const { deck, totalWidth } = useMemo(() => {
    const visible = photos.slice(-CAPTURE_STACK_VISIBLE_COUNT);
    const d = [...visible].reverse();
    const tw =
      CAPTURE_STACK_THUMB_SIZE +
      CAPTURE_STACK_OFFSET * Math.max(d.length - 1, 0);
    return { deck: d, totalWidth: tw };
  }, [photos]);

  if (photos.length === 0) {
    return (
      <View style={styles.placeholder} accessibilityLabel="No captures yet">
        <MaterialIcons
          name="photo-library"
          size={22}
          color={BrandColors.neutralMuted}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.stackHost,
        { aspectRatio: 1, height: CAPTURE_STACK_THUMB_SIZE },
      ]}
    >
      <View style={styles.thumbWrap}>
        <Image
          source={{ uri: photos[photos.length - 1].uri }}
          style={styles.thumb}
          contentFit="cover"
        />
      </View>
      <View
        style={{
          position: "absolute",
          top: "50%",
          right: "50%",
          transform: [{ translateY: -11 }, { translateX: 11 }],
          zIndex: 1000,
        }}
      >
        <MaterialIcons
          name="push-pin"
          size={22}
          color={BrandColors.primary}
        />
      </View>
    </View>
  );
}

export const CapturedImageStack = memo(CapturedImageStackInner);

const styles = StyleSheet.create({
  stackHost: {
    position: "relative",
  },
  thumbWrap: {
    position: "absolute",
    top: 0,
    width: CAPTURE_STACK_THUMB_SIZE,
    height: CAPTURE_STACK_THUMB_SIZE,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: BrandColors.secondary,
    backgroundColor: BrandColors.secondary,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    width: CAPTURE_STACK_THUMB_SIZE + CAPTURE_STACK_OFFSET * 2,
    height: CAPTURE_STACK_THUMB_SIZE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BrandColors.neutralBorder,
    backgroundColor: BrandColors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
});
