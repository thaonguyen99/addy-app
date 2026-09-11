import { Image } from "expo-image";
import { useMemo } from "react";
import { Pressable, StyleSheet } from "react-native";

import { BrandColors } from "@/constants/theme";
import { pickCover } from "@/features/feed/utils/pick-cover";
import type { MemoryListItem } from "@/types/api";

type MemoryThumbnailProps = {
  memory: MemoryListItem;
  size: number;
  onPress: (id: string) => void;
};

export function MemoryThumbnail({ memory, size, onPress }: MemoryThumbnailProps) {
  const cover = useMemo(() => pickCover(memory.images), [memory.images]);

  return (
    <Pressable
      style={[styles.tile, { width: size, height: size }]}
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
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: BrandColors.elevated,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
});
