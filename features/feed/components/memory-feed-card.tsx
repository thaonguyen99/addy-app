import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { StickerCard } from "@/components/ui/sticker-card";
import { StickerBorderWidth, StickerRadius } from "@/constants/sticker-style";
import { BrandColors } from "@/constants/theme";
import { MoodSticker } from "@/features/feed/components/mood-sticker";
import { formatRelativeTime } from "@/features/feed/utils/format-relative-time";
import { pickCover } from "@/features/feed/utils/pick-cover";
import type { MemoryListItem } from "@/types/api";

// Fixed so every card in a grid row lines up regardless of caption length.
const CAPTION_LINE_HEIGHT = 16;
const CAPTION_HEIGHT_COMPACT = CAPTION_LINE_HEIGHT + 10 * 2;
const CAPTION_HEIGHT_FULL = CAPTION_LINE_HEIGHT * 2 + 10 * 2;

type MemoryFeedCardProps = {
  memory: MemoryListItem;
  onPress: (id: string) => void;
  /** Single caption line only, no timestamp — for the dense home grid. */
  compact?: boolean;
};

function MemoryFeedCardBase({
  memory,
  onPress,
  compact = false,
}: MemoryFeedCardProps) {
  const cover = useMemo(() => pickCover(memory.images), [memory.images]);
  const timeAgo = formatRelativeTime(memory.capturedAt);
  const caption = memory.feeling?.trim() || memory.place.name;

  return (
    <Pressable
      onPress={() => onPress(memory.id)}
      accessibilityRole="button"
      accessibilityLabel={`Open memory at ${memory.place.name}`}
    >
      <StickerCard
        style={styles.frame}
        radius={StickerRadius.card}
        borderWidth={StickerBorderWidth.standard}
        backgroundColor={BrandColors.paper}
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
          <View style={compact ? styles.stickerInset : styles.sticker}>
            <MoodSticker
              score={memory.moodScore}
              size={compact ? 22 : 32}
              tilted={!compact}
              backgroundColor={compact ? BrandColors.accentYellow : undefined}
            />
          </View>
        </View>

        {/* <View
          style={[
            styles.caption,
            { height: compact ? CAPTION_HEIGHT_COMPACT : CAPTION_HEIGHT_FULL },
          ]}
        >
          <Text style={styles.note} numberOfLines={1}>
            {caption}
          </Text>
          {compact ? null : (
            <Text style={styles.meta} numberOfLines={1}>
              {timeAgo || memory.place.name}
            </Text>
          )}
        </View> */}
      </StickerCard>
    </Pressable>
  );
}

export const MemoryFeedCard = memo(MemoryFeedCardBase);

const styles = StyleSheet.create({
  frame: {
    width: "100%",
    overflow: "visible",
  },
  photoWrapper: {
    position: "relative",
    overflow: "visible",
  },
  photo: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: BrandColors.gray200,
  },
  photoFallback: { alignItems: "center", justifyContent: "center" },
  photoFallbackText: { fontSize: 40 },
  sticker: {
    position: "absolute",
    top: -8,
    right: -8,
  },
  stickerInset: {
    position: "absolute",
    top: 6,
    right: 6,
  },
  caption: {
    padding: 10,
    justifyContent: "center",
    gap: 3,
  },
  note: {
    fontSize: 13,
    lineHeight: CAPTION_LINE_HEIGHT,
    fontFamily: "Fredoka-SemiBold",
    color: BrandColors.ink,
  },
  meta: {
    fontSize: 11,
    lineHeight: CAPTION_LINE_HEIGHT,
    color: BrandColors.inkMuted,
  },
});
