import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { TechChip } from "@/components/ui/tech-chip";
import { AddyColors, AddyRadius } from "@/constants/theme";
import {
  PhotoOptionsSheet,
  type PhotoOptionsSheetRef,
} from "@/features/create-pin/components/photo-options-sheet";
import { saveImageToLibrary } from "@/features/media/save-image-to-library";
import { showToast } from "@/stores/toast.store";
import type { AddyMemoryImage } from "@/types/addy-memory";

const THUMB = 40;
const GAP = 8;
const SLOT = THUMB + GAP;
const SPRING = { damping: 20, stiffness: 260 };

type Positions = Record<string, number>;

type DraftPhotoProps = {
  images: readonly AddyMemoryImage[];
  size: number;
  adding: boolean;
  /** New order by id; the first one is the cover. */
  onReorder: (ids: string[]) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
};

function orderOf(images: readonly AddyMemoryImage[]): Positions {
  return Object.fromEntries(images.map((img, i) => [img.id, i]));
}

function haptic() {
  void Haptics.selectionAsync();
}

type DraggableThumbProps = {
  image: AddyMemoryImage;
  count: number;
  positions: SharedValue<Positions>;
  active: boolean;
  canRemove: boolean;
  onTap: (id: string) => void;
  onRemove: (id: string) => void;
  onDragState: (dragging: boolean) => void;
  onDrop: () => void;
};

/**
 * Strip thumbnail: tap to view it, long-press + drag to reorder. Whatever
 * sits in slot 1 is the cover.
 */
const DraggableThumb = memo(function DraggableThumb({
  image,
  count,
  positions,
  active,
  canRemove,
  onTap,
  onRemove,
  onDragState,
  onDrop,
}: DraggableThumbProps) {
  const { id } = image;
  const dragging = useSharedValue(false);
  const startX = useSharedValue(0);
  const dragX = useSharedValue(0);

  const pan = Gesture.Pan()
    .activateAfterLongPress(220)
    .onStart(() => {
      dragging.value = true;
      startX.value = positions.value[id] * SLOT;
      dragX.value = startX.value;
      runOnJS(onDragState)(true);
      runOnJS(haptic)();
    })
    .onUpdate((e) => {
      dragX.value = startX.value + e.translationX;
      const target = Math.min(
        count - 1,
        Math.max(0, Math.round(dragX.value / SLOT)),
      );
      const current = positions.value[id];
      if (target === current) return;
      // Swap with whichever thumb currently holds the target slot.
      const next = { ...positions.value };
      for (const key of Object.keys(next)) {
        if (next[key] === target) next[key] = current;
      }
      next[id] = target;
      positions.value = next;
      runOnJS(haptic)();
    })
    .onFinalize(() => {
      if (!dragging.value) return;
      dragging.value = false;
      runOnJS(onDragState)(false);
      runOnJS(onDrop)();
    });

  const tap = Gesture.Tap().onEnd(() => {
    runOnJS(onTap)(id);
  });

  const style = useAnimatedStyle(() => {
    const slot = positions.value[id] ?? 0;
    return {
      left: dragging.value ? dragX.value : withSpring(slot * SLOT, SPRING),
      zIndex: dragging.value ? 10 : 1,
      transform: [{ scale: withSpring(dragging.value ? 1.15 : 1, SPRING) }],
    };
  });

  const coverStyle = useAnimatedStyle(() => {
    const isCover = positions.value[id] === 0;
    return {
      borderColor: isCover ? AddyColors.lime : AddyColors.white,
      borderWidth: isCover ? 2.5 : 2,
    };
  });

  const starStyle = useAnimatedStyle(() => ({
    opacity: positions.value[id] === 0 ? 1 : 0,
  }));

  return (
    <Animated.View style={[styles.slot, style]}>
      <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
        <Animated.View
          style={[styles.thumb, coverStyle, active && styles.thumbActive]}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Photo. Tap to view, long-press and drag to reorder; the first photo is the cover"
        >
          <Image source={{ uri: image.uri }} style={styles.thumbImage} contentFit="cover" />
        </Animated.View>
      </GestureDetector>
      <Animated.Text style={[styles.star, starStyle]} pointerEvents="none">
        ★
      </Animated.Text>
      {canRemove ? (
        <Pressable
          onPress={() => onRemove(id)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Remove photo"
          style={styles.removeDot}
        >
          <Text style={styles.removeGlyph}>×</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
});

/**
 * The draft's photos, flat 1:1. Swipe to browse; the strip inside the bottom
 * edge jumps to a photo on tap, reorders on long-press drag (slot 1 = cover),
 * removes with the pink dot, and adds more with the dashed "+".
 */
export const DraftPhoto = memo(function DraftPhoto({
  images,
  size,
  adding,
  onReorder,
  onRemove,
  onAdd,
}: DraftPhotoProps) {
  const listRef = useRef<FlatList<AddyMemoryImage>>(null);
  const [activeId, setActiveId] = useState(images[0]?.id);
  const [dragging, setDragging] = useState(false);
  const positions = useSharedValue<Positions>(orderOf(images));

  // Re-sync slots whenever the set or order of photos changes from outside.
  useEffect(() => {
    positions.value = orderOf(images);
  }, [images, positions]);

  const activeIndex = Math.max(
    0,
    images.findIndex((img) => img.id === activeId),
  );

  // Keep showing the same photo when the list is reordered or shrinks.
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  useEffect(() => {
    let index = images.findIndex((img) => img.id === activeIdRef.current);
    if (index === -1) {
      index = 0;
      setActiveId(images[0]?.id);
    }
    listRef.current?.scrollToOffset({ offset: index * size, animated: false });
  }, [images, size]);

  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / size);
      setActiveId(images[index]?.id);
    },
    [images, size],
  );

  const showPhoto = useCallback(
    (id: string) => {
      const index = images.findIndex((img) => img.id === id);
      if (index === -1) return;
      setActiveId(id);
      listRef.current?.scrollToOffset({ offset: index * size, animated: true });
    },
    [images, size],
  );

  const onDrop = useCallback(() => {
    const order = positions.value;
    const ids = [...images]
      .sort((a, b) => order[a.id] - order[b.id])
      .map((img) => img.id);
    if (ids.some((id, i) => id !== images[i].id)) onReorder(ids);
  }, [images, onReorder, positions]);

  // The photo the options sheet was opened for, so a swipe while it's open
  // doesn't change what gets saved.
  const optionsSheet = useRef<PhotoOptionsSheetRef>(null);
  const [optionsImage, setOptionsImage] = useState<AddyMemoryImage | null>(null);

  const onSave = useCallback(async () => {
    if (!optionsImage) return;
    const result = await saveImageToLibrary(optionsImage.uri);
    if (result === "saved") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast("Saved to Photos");
    } else if (result === "denied") {
      Alert.alert(
        "Allow photo access",
        "Addy needs permission to save photos. You can turn it on in Settings.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => void Linking.openSettings() },
        ],
      );
    } else {
      showToast("Couldn't save the photo");
    }
  }, [optionsImage]);

  const active = images[activeIndex];
  if (!active) return null;

  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <FlatList
        ref={listRef}
        data={images}
        keyExtractor={(img) => img.id}
        horizontal
        pagingEnabled
        bounces={images.length > 1}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        getItemLayout={(_, index) => ({ length: size, offset: size * index, index })}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item.uri }}
            style={{ width: size, height: size }}
            contentFit="cover"
            transition={120}
          />
        )}
      />

      <View style={styles.topRow} pointerEvents="box-none">
        {active.sourceType === "quick_snap" ? (
          <TechChip label="quick snap" leading="⚡" tone="dark" size="sm" />
        ) : (
          <View />
        )}
        <View style={styles.topRight} pointerEvents="box-none">
          {images.length > 1 ? (
            <TechChip
              label={`${activeIndex + 1}/${images.length}${activeIndex === 0 ? " · cover" : ""}`}
              tone="dark"
              size="sm"
            />
          ) : null}
          {/* Only our own captures: gallery picks are already in Photos. */}
          {active.sourceType === "quick_snap" ? (
            <Pressable
              onPress={() => {
                setOptionsImage(active);
                optionsSheet.current?.present();
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Photo options"
              style={styles.moreButton}
            >
              <Ionicons name="ellipsis-horizontal" size={16} color={AddyColors.white} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        horizontal
        scrollEnabled={!dragging}
        showsHorizontalScrollIndicator={false}
        style={styles.strip}
        contentContainerStyle={styles.stripContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ width: images.length * SLOT, height: THUMB }}>
          {images.map((image) => (
            <DraggableThumb
              key={image.id}
              image={image}
              count={images.length}
              positions={positions}
              active={image.id === active.id}
              canRemove={images.length > 1}
              onTap={showPhoto}
              onRemove={onRemove}
              onDragState={setDragging}
              onDrop={onDrop}
            />
          ))}
        </View>
        <Pressable
          onPress={onAdd}
          disabled={adding}
          accessibilityRole="button"
          accessibilityLabel="Add photos from your gallery"
          style={[styles.thumb, styles.addTile, adding && styles.disabled]}
        >
          <Ionicons name="add" size={22} color={AddyColors.white} />
        </Pressable>
      </ScrollView>

      <PhotoOptionsSheet ref={optionsSheet} onSave={() => void onSave()} />
    </View>
  );
});

const styles = StyleSheet.create({
  frame: {
    borderRadius: AddyRadius.photo,
    overflow: "hidden",
    backgroundColor: AddyColors.paperDim,
  },
  topRow: {
    position: "absolute",
    top: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  moreButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(22, 23, 26, 0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  strip: { position: "absolute", left: 0, right: 0, bottom: 6 },
  // Top padding leaves room for the remove dots poking above the thumbs.
  stripContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 },
  slot: { position: "absolute", top: 0, width: THUMB, height: THUMB },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: AddyColors.white,
    overflow: "hidden",
  },
  thumbActive: { transform: [{ translateY: -3 }] },
  thumbImage: { flex: 1 },
  star: {
    position: "absolute",
    bottom: -2,
    left: 2,
    fontSize: 12,
    color: AddyColors.lime,
    textShadowColor: "rgba(22, 23, 26, 0.6)",
    textShadowRadius: 2,
  },
  addTile: {
    borderStyle: "dashed",
    backgroundColor: "rgba(22, 23, 26, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeDot: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: AddyColors.pink,
    borderWidth: 1.5,
    borderColor: AddyColors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  removeGlyph: {
    color: AddyColors.white,
    fontSize: 13,
    lineHeight: 14,
    fontWeight: "700",
  },
  disabled: { opacity: 0.5 },
});
