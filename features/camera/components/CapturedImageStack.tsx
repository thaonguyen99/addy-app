import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { StickerShadowBox } from "@/components/ui/sticker-shadow";
import { BrandColors } from "@/constants/theme";
import { StickerBorderWidth } from "@/constants/sticker-style";
import {
  CAPTURE_STACK_OFFSET,
  CAPTURE_STACK_THUMB_SIZE,
  CAPTURE_STACK_VISIBLE_COUNT,
} from "@/features/camera/constants/layout";
import type { AddyMemoryImage } from "@/types/addy-memory";

const FRAME_RADIUS = 12;

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
      <View accessibilityLabel="No captures yet">
        <StickerShadowBox radius={FRAME_RADIUS} style={styles.placeholderShadow}>
          <View style={styles.placeholder}>
            <MaterialIcons
              name="photo-library"
              size={22}
              color={BrandColors.inkMuted}
            />
          </View>
        </StickerShadowBox>
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
      <StickerShadowBox radius={FRAME_RADIUS} style={styles.thumbShadow}>
        <View style={styles.thumbFrame}>
          <LinearGradient
            colors={[BrandColors.primaryLight, BrandColors.primary]}
            style={StyleSheet.absoluteFillObject}
          />
          <Image
            source={{ uri: photos[photos.length - 1].uri }}
            style={styles.thumb}
            contentFit="cover"
          />
        </View>
      </StickerShadowBox>
      <View style={styles.pinBadge}>
        <MaterialIcons name="push-pin" size={14} color={BrandColors.ink} />
      </View>
    </View>
  );
}

export const CapturedImageStack = memo(CapturedImageStackInner);

const styles = StyleSheet.create({
  stackHost: {
    position: "relative",
  },
  placeholderShadow: {
    width: CAPTURE_STACK_THUMB_SIZE + CAPTURE_STACK_OFFSET * 2,
    height: CAPTURE_STACK_THUMB_SIZE,
  },
  placeholder: {
    flex: 1,
    borderRadius: FRAME_RADIUS,
    borderWidth: StickerBorderWidth.standard,
    borderColor: BrandColors.ink,
    backgroundColor: BrandColors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbShadow: {
    width: CAPTURE_STACK_THUMB_SIZE,
    height: CAPTURE_STACK_THUMB_SIZE,
  },
  thumbFrame: {
    flex: 1,
    borderRadius: FRAME_RADIUS,
    overflow: "hidden",
    borderWidth: StickerBorderWidth.standard,
    borderColor: BrandColors.ink,
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  pinBadge: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: BrandColors.paper,
    borderWidth: 2,
    borderColor: BrandColors.ink,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
});
