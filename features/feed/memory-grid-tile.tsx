import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AddyColors, AddyFonts, AddyRadius } from "@/constants/theme";
import { MoodSticker } from "@/features/feed/mood-sticker";
import { pickCover } from "@/utils/pick-cover";
import { showQueuedPinActions } from "@/features/pin-queue/queued-pin-actions";
import {
  queuedPinPlaceName,
  type QueuedPin,
} from "@/features/pin-queue/pin-queue-types";
import { cloudinaryThumb } from "@/lib/cloudinary-thumb";
import type { MemoryListItem } from "@/services/memories";

type MemoryGridTileProps = {
  memory: MemoryListItem;
  size: number;
  onPress: (id: string) => void;
};

/** You-tab grid tile: square cover (thumbnail-sized), mood sticker, no caption. */
export const MemoryGridTile = memo(function MemoryGridTile({
  memory,
  size,
  onPress,
}: MemoryGridTileProps) {
  const cover = useMemo(() => pickCover(memory.images), [memory.images]);

  return (
    <Pressable
      onPress={() => onPress(memory.id)}
      accessibilityRole="button"
      accessibilityLabel={`Memory at ${memory.place.name}`}
      style={({ pressed }) => [
        styles.tile,
        { width: size, height: size },
        pressed && styles.pressed,
      ]}
    >
      {cover ? (
        <Image
          source={{ uri: cloudinaryThumb(cover.url, size) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          recyclingKey={memory.id}
          transition={120}
        />
      ) : (
        <Text style={styles.fallback}>📷</Text>
      )}
      <View style={styles.sticker} pointerEvents="none">
        <MoodSticker score={memory.moodScore} size={18} seed={memory.id} />
      </View>
    </Pressable>
  );
});

type QueuedGridTileProps = {
  pin: QueuedPin;
  size: number;
};

/** A pin still in the offline queue: dimmed photo with a waiting/retry chip. */
export const QueuedGridTile = memo(function QueuedGridTile({
  pin,
  size,
}: QueuedGridTileProps) {
  const failed = pin.status === "failed";

  return (
    <Pressable
      onPress={() => showQueuedPinActions(pin)}
      accessibilityRole="button"
      accessibilityLabel={
        failed
          ? `Couldn't upload memory at ${queuedPinPlaceName(pin)}. Tap to retry or delete.`
          : `Memory at ${queuedPinPlaceName(pin)}, waiting to upload`
      }
      style={[styles.tile, { width: size, height: size }]}
    >
      <Image
        source={{ uri: pin.photoPaths[0] }}
        style={[StyleSheet.absoluteFill, styles.queuedPhoto]}
        contentFit="cover"
      />
      <View style={styles.queuedOverlay}>
        <Text style={[styles.queuedChip, failed && styles.queuedChipFailed]}>
          {failed ? "! retry" : "⏳ waiting"}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  tile: {
    borderRadius: AddyRadius.tile,
    overflow: "hidden",
    backgroundColor: AddyColors.paperDim,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.8 },
  fallback: { fontSize: 24 },
  sticker: { position: "absolute", right: 3, bottom: 1 },
  queuedPhoto: { opacity: 0.55 },
  queuedOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  queuedChip: {
    fontFamily: AddyFonts.tech,
    fontSize: 15,
    color: AddyColors.ink,
    backgroundColor: AddyColors.cyan,
    paddingHorizontal: 6,
    borderRadius: AddyRadius.chip,
    overflow: "hidden",
  },
  queuedChipFailed: { backgroundColor: AddyColors.pink, color: AddyColors.white },
});
