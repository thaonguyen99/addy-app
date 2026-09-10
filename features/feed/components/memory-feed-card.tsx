import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BrandColors } from "@/constants/theme";
import { MOOD_SCORE_OPTIONS } from "@/features/camera/constants/mood-score";
import { formatRelativeTime } from "@/features/feed/utils/format-relative-time";
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
  const mood =
    memory.moodScore != null
      ? MOOD_SCORE_OPTIONS.find((o) => o.score === memory.moodScore)
      : null;
  const timeAgo = formatRelativeTime(memory.capturedAt);

  return (
    <View style={[styles.tilt, { transform: [{ rotate: rotation }] }]}>
      <Pressable
        style={styles.frame}
        onPress={() => onPress(memory.id)}
        accessibilityRole="button"
        accessibilityLabel={`Open memory at ${memory.place.name}`}
      >
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

        <View style={styles.caption}>
          {memory.feeling ? (
            <Text style={styles.note} numberOfLines={2}>
              {memory.feeling}
            </Text>
          ) : null}
          <Text style={styles.place} numberOfLines={1}>
            {memory.place.name}
          </Text>
          {mood || timeAgo ? (
            <Text style={styles.meta} numberOfLines={1}>
              {mood ? `${mood.emoji} ` : ""}
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
  photo: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 1,
    backgroundColor: BrandColors.gray200,
  },
  photoFallback: { alignItems: "center", justifyContent: "center" },
  photoFallbackText: { fontSize: 40 },
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
