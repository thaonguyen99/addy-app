import { Image } from "expo-image";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { PlaceTag } from "@/components/ui/place-tag";
import { ADDY_BORDER_WIDTH, AddyColors, AddyFonts } from "@/constants/theme";
import { MoodSticker } from "@/features/feed/mood-sticker";
import { ChatAvatar } from "@/features/memory/chat-avatar";
import {
  HEART_CHIP_OVERHANG,
  HeartChip,
  Likeable,
} from "@/features/memory/likeable";
import { cloudinaryThumb } from "@/lib/cloudinary-thumb";
import type { MemoryDetail, MemoryImage } from "@/services/memories";
import { formatRelativeTime } from "@/utils/format-relative-time";

const SIDE_PADDING = 16;
const AVATAR_SIZE = 30;
const AVATAR_GAP = 8;
const INSET = 6;

/** Reveal timeline (ms): the screen's white flash runs 0–500; the photo
 *  uncovers top-to-bottom from REVEAL_START, then the sticker lands. */
const REVEAL_START = 350;
const REVEAL_MS = 1000;
const STICKER_START = REVEAL_START + REVEAL_MS;

function sortImages(images: MemoryImage[]): MemoryImage[] {
  return [...images].sort((a, b) => {
    if (a.type === "cover") return -1;
    if (b.type === "cover") return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

type MemoryPostBubbleProps = {
  memory: MemoryDetail;
  onToggleLike: () => void;
  onOpenReactors: () => void;
  onLongPress: () => void;
  /** Tap the owner's avatar or name to open their profile. */
  onPressAuthor?: (username: string) => void;
  /** Play the "on this day" arrival: photo reveals top-to-bottom, then the
   *  mood sticker lands. Skipped when the OS asks for reduced motion. */
  reveal?: boolean;
};

/**
 * The memory itself as the first chat message: 1:1 photos, caption, place
 * tag, mood sticker on the outer top corner. Aligned from the viewer's side
 * like any bubble — the owner sees it on the right (pale lime), a friend on
 * the left with the owner's avatar.
 */
export const MemoryPostBubble = memo(function MemoryPostBubble({
  memory,
  onToggleLike,
  onOpenReactors,
  onLongPress,
  onPressAuthor,
  reveal = false,
}: MemoryPostBubbleProps) {
  const { width } = useWindowDimensions();
  const mine = memory.isOwner;
  // Same width on both sides, so the photo doesn't change size by viewer.
  const bubbleWidth = width - SIDE_PADDING * 2 - AVATAR_SIZE - AVATAR_GAP;
  const photoSize = bubbleWidth - INSET * 2 - ADDY_BORDER_WIDTH * 2;

  const reducedMotion = useReducedMotion();
  // Decided once on mount, so a re-render can't replay or cut the reveal.
  const [animate] = useState(() => reveal && !reducedMotion);
  const uncovered = useSharedValue(animate ? 0 : 1);
  const landed = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) return;
    uncovered.value = withDelay(
      REVEAL_START,
      withTiming(1, { duration: REVEAL_MS, easing: Easing.out(Easing.cubic) }),
    );
    landed.value = withDelay(
      STICKER_START,
      withSpring(1, { damping: 9, stiffness: 180, mass: 0.7 }),
    );
  }, [animate, uncovered, landed]);

  const coverStyle = useAnimatedStyle(() => ({
    height: (1 - uncovered.value) * photoSize,
  }));
  const stickerStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, landed.value * 2),
    transform: [
      { scale: 2.4 - 1.4 * landed.value },
      { rotate: `${(1 - landed.value) * -40}deg` },
    ],
  }));

  const images = useMemo(() => sortImages(memory.images), [memory.images]);
  const [page, setPage] = useState(0);
  const onMomentumEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      setPage(Math.round(e.nativeEvent.contentOffset.x / photoSize));
    },
    [photoSize],
  );

  return (
    <View
      style={[
        styles.row,
        mine ? styles.rowRight : styles.rowLeft,
        memory.reactionCount > 0 && styles.rowWithChip,
      ]}
    >
      {mine ? null : (
        <Pressable
          onPress={() => onPressAuthor?.(memory.author.username)}
          disabled={!onPressAuthor}
          accessibilityRole="button"
          accessibilityLabel={`Open ${memory.author.username}'s profile`}
          style={styles.avatarSlot}
        >
          <ChatAvatar user={memory.author} size={AVATAR_SIZE} />
        </Pressable>
      )}
      <View style={mine ? styles.columnRight : styles.columnLeft}>
        <View style={styles.metaRow}>
          {mine ? null : (
            <Text
              style={styles.name}
              numberOfLines={1}
              onPress={
                onPressAuthor
                  ? () => onPressAuthor(memory.author.username)
                  : undefined
              }
            >
              {memory.author.name ?? memory.author.username}
            </Text>
          )}
          {mine ? null : <Text style={styles.ownerTag}>✦ owner</Text>}
          <Text style={styles.meta}>
            {formatRelativeTime(memory.capturedAt)}
          </Text>
        </View>

        <View>
          <Likeable
            liked={memory.hasReacted}
            onToggleLike={onToggleLike}
            onLongPress={onLongPress}
            accessibilityLabel={`Memory at ${memory.place.name}${memory.feeling ? `: ${memory.feeling}` : ""}`}
            style={[
              styles.bubble,
              { width: bubbleWidth },
              mine ? styles.bubbleMine : styles.bubbleOther,
            ]}
          >
            <View
              style={[styles.photo, { width: photoSize, height: photoSize }]}
            >
              {images.length > 0 ? (
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={onMomentumEnd}
                >
                  {images.map((img) => (
                    <Image
                      key={img.publicId}
                      source={{ uri: cloudinaryThumb(img.url, photoSize) }}
                      style={{ width: photoSize, height: photoSize }}
                      contentFit="cover"
                      transition={150}
                    />
                  ))}
                </ScrollView>
              ) : (
                <Text style={styles.placeholder}>📷</Text>
              )}
              {images.length > 1 ? (
                <View style={styles.dots} pointerEvents="none">
                  {images.map((img, i) => (
                    <View
                      key={img.publicId}
                      style={[styles.dot, i === page && styles.dotActive]}
                    />
                  ))}
                </View>
              ) : null}
              {animate ? (
                <Animated.View
                  pointerEvents="none"
                  style={[styles.revealCover, coverStyle]}
                />
              ) : null}
            </View>

            <View style={styles.body}>
              {memory.feeling ? (
                <Text style={styles.caption}>{memory.feeling}</Text>
              ) : null}
              <PlaceTag name={memory.place.name} />
            </View>

            <HeartChip
              count={memory.reactionCount}
              liked={memory.hasReacted}
              side="right"
              onPress={onOpenReactors}
              accessibilityLabel={`${memory.reactionCount} reactions. See who reacted`}
            />
          </Likeable>
          <Animated.View
            style={[
              styles.sticker,
              mine ? styles.stickerLeft : styles.stickerRight,
              stickerStyle,
            ]}
            pointerEvents="none"
          >
            <MoodSticker score={memory.moodScore} size={34} seed={memory.id} />
          </Animated.View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: AVATAR_GAP,
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 8,
    marginBottom: 14,
  },
  rowWithChip: { marginBottom: 14 + HEART_CHIP_OVERHANG },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },
  avatarSlot: { paddingBottom: 2 },
  columnLeft: { alignItems: "flex-start", gap: 3 },
  columnRight: { alignItems: "flex-end", gap: 3 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  name: {
    fontFamily: AddyFonts.titleSemiBold,
    fontSize: 13,
    color: AddyColors.ink,
    flexShrink: 1,
  },
  ownerTag: {
    fontFamily: AddyFonts.tech,
    fontSize: 15,
    color: AddyColors.pink,
  },
  meta: {
    fontFamily: AddyFonts.tech,
    fontSize: 15,
    color: AddyColors.inkMuted,
  },

  bubble: {
    padding: INSET,
    borderWidth: ADDY_BORDER_WIDTH,
    borderRadius: 16,
    gap: 8,
  },
  bubbleMine: {
    backgroundColor: AddyColors.limePale,
    borderColor: AddyColors.limeDeep,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: AddyColors.white,
    borderColor: AddyColors.line,
    borderBottomLeftRadius: 4,
  },
  photo: {
    borderRadius: 11,
    overflow: "hidden",
    backgroundColor: AddyColors.paperDim,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholder: { fontSize: 40 },
  dots: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },
  dotActive: { width: 16, backgroundColor: AddyColors.white },
  body: {
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 4,
    position: "relative",
  },
  caption: {
    fontFamily: AddyFonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: AddyColors.ink,
  },
  // Top corner away from the name line: left on your own post, right on a
  // friend's (whose name sits top-left).
  sticker: { position: "absolute", top: -18 },
  // Anchored to the bottom and shrinking, so the photo appears top-down.
  revealCover: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: AddyColors.white,
  },
  stickerRight: { right: -10 },
  stickerLeft: { left: -10 },
});
