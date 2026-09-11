import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BrandColors } from "@/constants/theme";
import { formatRelativeTime } from "@/features/feed/utils/format-relative-time";
import { MoodSticker } from "@/features/feed/components/mood-sticker";
import { POLAROID, rotationForId } from "@/features/feed/utils/polaroid";
import type { MemoryImage, MemoryListItem } from "@/types/api";

function pickCover(images: MemoryImage[]): MemoryImage | null {
  if (images.length === 0) return null;
  const cover = images.find((img) => img.type === "cover");
  if (cover) return cover;
  return [...images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
}

type MemoryFeedCardProps = {
  memory: MemoryListItem;
  onPress: (id: string) => void;
};

function MemoryFeedCardBase({ memory, onPress }: MemoryFeedCardProps) {
  const cover = useMemo(() => pickCover(memory.images), [memory.images]);
  const rotation = useMemo(() => rotationForId(memory.id), [memory.id]);
  const timeAgo = formatRelativeTime(memory.capturedAt);

  return (
    <View style={[styles.tilt, { transform: [{ rotate: rotation }] }]}>
      <Pressable
        style={styles.frame}
        onPress={() => onPress(memory.id)}
        accessibilityRole="button"
        accessibilityLabel={`Open memory at ${memory.place.name}`}
      >
        <View style={styles.photoWrapper}>
          {cover ? (
            <Image
              source={{ uri: cover.url }}
              style={styles.photo}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View style={[styles.photo, styles.photoFallback]}>
              <Text style={styles.photoFallbackText}>📷</Text>
            </View>
          )}
          <View style={styles.sticker}>
            <MoodSticker score={memory.moodScore} />
          </View>
        </View>

        <View style={styles.caption}>
          {memory.feeling ? (
            <Text style={styles.note} numberOfLines={2}>
              {memory.feeling}
            </Text>
          ) : null}
          <Text style={styles.place} numberOfLines={1}>
            {memory.place.name}
          </Text>
          {timeAgo ? (
            <Text style={styles.meta} numberOfLines={1}>
              {timeAgo}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

export const MemoryFeedCard = memo(MemoryFeedCardBase);

const styles = StyleSheet.create({
  tilt: {
    alignItems: "center",
  },
  frame: {
    width: "100%",
    backgroundColor: POLAROID.frameColor,
    borderRadius: POLAROID.radius,
    paddingTop: POLAROID.borderTop,
    paddingLeft: POLAROID.borderSide,
    paddingRight: POLAROID.borderSide,
    paddingBottom: POLAROID.borderBottom,
    ...POLAROID.shadow,
  },
  photoWrapper: {
    position: "relative",
  },
  photo: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 1,
    backgroundColor: BrandColors.gray200,
  },
  photoFallback: { alignItems: "center", justifyContent: "center" },
  photoFallbackText: { fontSize: 40 },
  sticker: {
    position: "absolute",
    top: -8,
    right: -8,
  },
  caption: {
    paddingTop: 10,
    gap: 3,
  },
  note: {
    fontSize: 13,
    lineHeight: 18,
    color: BrandColors.ink,
  },
  place: {
    fontSize: 11,
    fontWeight: "600",
    color: BrandColors.inkMuted,
  },
  meta: {
    fontSize: 11,
    color: BrandColors.inkMuted,
    opacity: 0.75,
  },
});
