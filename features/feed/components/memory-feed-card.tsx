import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BrandColors } from "@/constants/theme";
import { MOOD_SCORE_OPTIONS } from "@/features/camera/constants/mood-score";
import { formatRelativeTime } from "@/features/feed/utils/format-relative-time";
import type { MemoryImage, MemoryListItem } from "@/types/api";

const CARD_IMAGE_RATIO = 1; // square, Instagram-style

function pickCover(images: MemoryImage[]): MemoryImage | null {
  if (images.length === 0) return null;
  const cover = images.find((img) => img.type === "cover");
  if (cover) return cover;
  return [...images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
}

type MemoryFeedCardProps = {
  memory: MemoryListItem;
  authorName: string;
  onPress: (id: string) => void;
};

function MemoryFeedCardBase({
  memory,
  authorName,
  onPress,
}: MemoryFeedCardProps) {
  const cover = useMemo(() => pickCover(memory.images), [memory.images]);
  const mood =
    memory.moodScore != null
      ? MOOD_SCORE_OPTIONS.find((o) => o.score === memory.moodScore)
      : null;
  const initial = authorName.charAt(0).toUpperCase() || "Y";
  const timeAgo = formatRelativeTime(memory.capturedAt);

  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress(memory.id)}
      accessibilityRole="button"
      accessibilityLabel={`Open memory at ${memory.place.name}`}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.author} numberOfLines={1}>
            {authorName}
          </Text>
          <Text style={styles.place} numberOfLines={1}>
            📍 {memory.place.name}
          </Text>
        </View>
        {timeAgo ? <Text style={styles.time}>{timeAgo}</Text> : null}
      </View>

      {cover ? (
        <Image
          source={{ uri: cover.url }}
          style={styles.image}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Text style={styles.imageFallbackText}>📷</Text>
        </View>
      )}

      <View style={styles.body}>
        {mood ? (
          <View style={styles.moodPill}>
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text style={styles.moodLabel}>{mood.label}</Text>
          </View>
        ) : null}

        {memory.feeling ? (
          <Text style={styles.caption} numberOfLines={3}>
            <Text style={styles.captionAuthor}>{authorName} </Text>
            {memory.feeling}
          </Text>
        ) : null}

        <Text style={styles.address} numberOfLines={1}>
          {memory.place.formattedAddress}
        </Text>
      </View>
    </Pressable>
  );
}

export const MemoryFeedCard = memo(MemoryFeedCardBase);

const styles = StyleSheet.create({
  card: {
    backgroundColor: BrandColors.gray900,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BrandColors.stroke2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BrandColors.primaryMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: BrandColors.neutral,
    fontWeight: "700",
    fontSize: 15,
  },
  headerText: { flex: 1, gap: 2 },
  author: {
    color: BrandColors.neutral,
    fontWeight: "600",
    fontSize: 14,
  },
  place: {
    color: BrandColors.neutralMuted,
    fontSize: 12,
  },
  time: {
    color: BrandColors.neutralMuted,
    fontSize: 12,
  },
  image: {
    width: "100%",
    aspectRatio: CARD_IMAGE_RATIO,
    backgroundColor: BrandColors.elevated,
  },
  imageFallback: { alignItems: "center", justifyContent: "center" },
  imageFallbackText: { fontSize: 40 },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  moodPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: BrandColors.elevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  moodEmoji: { fontSize: 14 },
  moodLabel: {
    color: BrandColors.neutral,
    fontSize: 12,
    fontWeight: "600",
  },
  caption: {
    color: BrandColors.neutral,
    fontSize: 14,
    lineHeight: 20,
  },
  captionAuthor: { fontWeight: "600" },
  address: {
    color: BrandColors.neutralMuted,
    fontSize: 12,
  },
});
