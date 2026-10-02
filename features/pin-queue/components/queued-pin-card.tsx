import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { StickerCard } from "@/components/ui/sticker-card";
import { StickerBorderWidth, StickerRadius } from "@/constants/sticker-style";
import { BrandColors } from "@/constants/theme";
import { MoodSticker } from "@/features/feed/components/mood-sticker";
import { showQueuedPinActions } from "@/features/pin-queue/queued-pin-actions";
import {
  queuedPinPlaceName,
  type QueuedPin,
} from "@/features/pin-queue/pin-queue-types";

/** Home-grid tile for a pin still in the offline queue — same frame as MemoryFeedCard (compact). */
function QueuedPinCardBase({ pin }: { pin: QueuedPin }) {
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
    >
      <StickerCard
        style={styles.frame}
        radius={StickerRadius.card}
        borderWidth={StickerBorderWidth.standard}
        borderStyle={failed ? "solid" : "dashed"}
        backgroundColor={BrandColors.paper}
      >
        <View style={styles.photoWrapper}>
          <Image
            source={{ uri: pin.photoPaths[0] }}
            style={[styles.photo, failed && styles.photoFailed]}
            contentFit="cover"
          />
          <View style={styles.stickerInset}>
            <MoodSticker
              score={pin.moodScore}
              size={22}
              tilted={false}
              backgroundColor={BrandColors.accentYellow}
            />
          </View>
          <View style={styles.badgeWrap}>
            <StickerCard
              radius={StickerRadius.chip}
              borderWidth={StickerBorderWidth.thin}
              backgroundColor={failed ? BrandColors.dangerLight : BrandColors.accentCyan}
              shadowOffset={2}
            >
              <Text style={styles.badgeText} numberOfLines={2}>
                {failed ? "Couldn't upload — tap to retry" : "⏳ waiting to upload"}
              </Text>
            </StickerCard>
          </View>
        </View>
      </StickerCard>
    </Pressable>
  );
}

export const QueuedPinCard = memo(QueuedPinCardBase);

const styles = StyleSheet.create({
  frame: { width: "100%", overflow: "visible" },
  photoWrapper: { position: "relative", overflow: "visible" },
  photo: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: BrandColors.gray200,
  },
  photoFailed: { opacity: 0.55 },
  stickerInset: { position: "absolute", top: 6, right: 6 },
  badgeWrap: { position: "absolute", left: 4, right: 4, bottom: 4 },
  badgeText: {
    fontSize: 10,
    lineHeight: 12,
    fontFamily: "Fredoka-SemiBold",
    color: BrandColors.ink,
    textAlign: "center",
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
});
