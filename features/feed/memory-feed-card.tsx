import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { StickerCard } from "@/components/ui/sticker-card";
import { StickerBorderWidth, StickerRadius } from "@/constants/sticker-style";
import { BrandColors } from "@/constants/theme";
import { MoodSticker } from "@/features/feed/mood-sticker";
import { pickCover } from "@/utils/pick-cover";
import type { MemoryListItem } from "@/services/memories";

type MemoryFeedCardProps = {
  memory: MemoryListItem;
  onPress: (id: string) => void;
  /** Smaller, inset mood sticker — for the dense home grid. */
  compact?: boolean;
};

function MemoryFeedCardBase({
  memory,
  onPress,
  compact = false,
}: MemoryFeedCardProps) {
  const cover = useMemo(() => pickCover(memory.images), [memory.images]);

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
              size={compact ? 18 : 26}
              seed={memory.id}
            />
          </View>
        </View>
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
});
