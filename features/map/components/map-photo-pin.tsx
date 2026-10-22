import { memo } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { SoftShadowBox } from "@/components/ui/soft-shadow";
import { PhotoPin } from "@/components/ui/photo-pin";
import { MAP_LABEL_NAVY } from "@/constants/map-style";
import { AddyColors, AddyFonts, AddyShadow, BrandColors } from "@/constants/theme";
import { MapMoodSticker } from "@/features/map/components/map-mood-sticker";
import { PlaceLabelBubble } from "@/features/map/components/place-label-bubble";
import type { QueuedPinStatus } from "@/features/pin-queue/pin-queue-types";

type MapPhotoPinProps = {
  imageUrl?: string;
  pinColor: string;
  /** Memories sharing this place (real, populated data) — tap opens the
   *  place sheet instead of navigating straight to one memory. */
  placeMemoryCount?: number;
  /** Photos on this memory beyond its cover — not yet sent by the map-pin
   *  endpoints, so this stays hidden until it is. */
  extraPhotoCount?: number;
  /** Not yet sent by the map-pin endpoints for server pins; local queued
   *  pins do have it today. */
  placeName?: string;
  moodScore?: number | null;
  /** Zoom-gated: place labels only render when zoomed in enough. */
  showLabel?: boolean;
  /** True once this pin sits in the right ~40% of the screen, so the label
   *  flips to grow left instead of running off the edge. */
  flipped?: boolean;
  /** Marks this as a friend's memory rather than the user's own. */
  isFriend?: boolean;
  /** Set for a pin still in the offline queue: "waiting" / "couldn't upload" sticker. */
  queueStatus?: QueuedPinStatus;
};

const PIN_SIZE = 64;
const PIN_HEIGHT = (PIN_SIZE / 100) * 128;
const MOOD_SIZE = 28;

/**
 * The map marker: PhotoPin plus its bolt-ons — place count, friend/queue
 * indicators, and (where data allows) a place-name label and mood sticker.
 */
export const MapPhotoPin = memo(function MapPhotoPin({
  imageUrl,
  pinColor,
  placeMemoryCount,
  extraPhotoCount,
  placeName,
  moodScore,
  showLabel = false,
  flipped = false,
  isFriend,
  queueStatus,
}: MapPhotoPinProps) {
  const moodSide = flipped ? "right" : "left";

  return (
    <View style={styles.wrapper}>
      {showLabel ? (
        <PlaceLabelBubble
          placeName={placeName}
          flipped={flipped}
          style={[
            styles.label,
            flipped
              ? { right: PIN_SIZE / 2 - 14 }
              : { left: PIN_SIZE / 2 - 14 },
          ]}
        />
      ) : null}

      <MapMoodSticker
        moodScore={moodScore}
        style={[
          styles.mood,
          moodSide === "left"
            ? { left: -(MOOD_SIZE / 2 + 6) }
            : { right: -(MOOD_SIZE / 2 + 6) },
        ]}
      />

      <PhotoPin uri={imageUrl} size={PIN_SIZE} pinColor={pinColor} />

      {queueStatus ? (
        <SoftShadowBox
          radius={11}
          style={[
            styles.queueBadge,
            queueStatus === "failed" && styles.queueBadgeFailed,
          ]}
        >
          <Text style={styles.queueBadgeText}>
            {queueStatus === "failed" ? "! retry" : "⏳ waiting"}
          </Text>
        </SoftShadowBox>
      ) : null}

      {isFriend ? <SoftShadowBox radius={8} style={styles.friendDot} /> : null}

      {extraPhotoCount != null && extraPhotoCount > 0 ? (
        <SoftShadowBox radius={12} style={styles.extraPhotoBadge}>
          <Text style={styles.extraPhotoBadgeText}>+{extraPhotoCount}</Text>
        </SoftShadowBox>
      ) : null}

      {placeMemoryCount != null && placeMemoryCount > 1 ? (
        <PinCountBadge count={placeMemoryCount} style={styles.countBadge} />
      ) : null}
    </View>
  );
});

type PinCountBadgeProps = {
  count: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * How many memories a pin stands for (several at one place, or a cluster).
 * Navy so it never reads as the white "+N photos" pill.
 */
export const PinCountBadge = memo(function PinCountBadge({
  count,
  style,
}: PinCountBadgeProps) {
  return (
    <View
      style={[styles.countBadgeBase, style]}
      accessibilityLabel={`${count} memories`}
    >
      <Text style={styles.countBadgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
});

export const MAP_PHOTO_PIN_WIDTH = PIN_SIZE;
export const MAP_PHOTO_PIN_HEIGHT = PIN_HEIGHT;

const styles = StyleSheet.create({
  wrapper: { alignItems: "center" },
  label: {
    position: "absolute",
    bottom: PIN_HEIGHT + 4,
  },
  mood: {
    position: "absolute",
    top: PIN_HEIGHT * 0.3 - MOOD_SIZE / 2,
    zIndex: 2,
  },
  // Top-left: extra photos on this memory beyond its cover (gap data today).
  extraPhotoBadge: {
    position: "absolute",
    top: -4,
    left: -4,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    backgroundColor: BrandColors.white,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  extraPhotoBadgeText: {
    color: MAP_LABEL_NAVY,
    fontSize: 17,
    lineHeight: 18,
    fontFamily: AddyFonts.tech,
  },
  // Top-right: memories sharing this place (real data, drives navigation).
  countBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    zIndex: 3,
  },
  countBadgeBase: {
    minWidth: 24,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: AddyColors.white,
    backgroundColor: AddyColors.navy,
    alignItems: "center",
    justifyContent: "center",
    ...AddyShadow.soft,
  },
  countBadgeText: {
    color: AddyColors.white,
    fontSize: 17,
    lineHeight: 18,
    fontFamily: AddyFonts.tech,
  },
  queueBadge: {
    position: "absolute",
    top: -8,
    left: -12,
    paddingHorizontal: 6,
    height: 22,
    backgroundColor: BrandColors.accentCyan,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  queueBadgeFailed: { backgroundColor: BrandColors.dangerLight },
  queueBadgeText: {
    color: BrandColors.ink,
    fontSize: 16,
    lineHeight: 18,
    fontFamily: AddyFonts.tech,
  },
  friendDot: {
    position: "absolute",
    left: -2,
    bottom: 24,
    width: 16,
    height: 16,
    backgroundColor: BrandColors.accentPink,
    zIndex: 3,
  },
});
