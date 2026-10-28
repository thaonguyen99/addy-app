import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AddyColors, AddyFonts, AddyRadius, AddyShadow } from "@/constants/theme";
import { MoodSticker } from "@/features/feed/mood-sticker";
import { PillButton } from "@/features/friends/components/pill-button";
import { cloudinaryThumb } from "@/lib/cloudinary-thumb";
import type { OnThisDayMemory } from "@/services/memories";
import { formatDayMonthYear } from "@/utils/format-relative-time";
import { pickCover } from "@/utils/pick-cover";

const THUMB = 58;

/** Pinned on top of the 🔔 list when today has memories from earlier years. */
export function OnThisDayCard({ memory }: { memory: OnThisDayMemory }) {
  const cover = pickCover(memory.images);
  const years = memory.yearsAgo === 1 ? "1 year ago" : `${memory.yearsAgo} years ago`;

  const relive = () =>
    router.push({
      pathname: "/memory/[id]",
      params: { id: memory.id, reveal: "on-this-day" },
    });

  return (
    <View style={[styles.card, AddyShadow.soft]}>
      <LinearGradient
        colors={["#FFF6CC", "#FFE07A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.radius]}
      />
      <Text style={styles.tag}>✦ on this day · {years}</Text>
      <View style={styles.inner}>
        <View>
          {cover ? (
            <Image
              source={{ uri: cloudinaryThumb(cover.url, THUMB) }}
              style={styles.thumb}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.thumb, styles.thumbEmpty]} />
          )}
          <View style={styles.mood}>
            <MoodSticker score={memory.moodScore} size={20} seed={memory.id} />
          </View>
        </View>
        <View style={styles.text}>
          {memory.feeling ? (
            <Text style={styles.caption} numberOfLines={2}>
              {memory.feeling}
            </Text>
          ) : null}
          <Text style={styles.meta} numberOfLines={2}>
            📍 {memory.place.name} · {formatDayMonthYear(memory.capturedAt)}
          </Text>
        </View>
      </View>
      <PillButton
        label="Relive it ›"
        tone="paper"
        onPress={relive}
        style={[styles.button, AddyShadow.soft]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    marginBottom: 6,
    paddingTop: 18,
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderRadius: AddyRadius.card,
  },
  radius: { borderRadius: AddyRadius.card },
  tag: {
    position: "absolute",
    top: -10,
    left: 12,
    fontFamily: AddyFonts.tech,
    fontSize: 16,
    color: AddyColors.lime,
    backgroundColor: AddyColors.ink,
    borderRadius: 9,
    paddingHorizontal: 9,
    overflow: "hidden",
  },
  inner: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumb: { width: THUMB, height: THUMB, borderRadius: 12 },
  thumbEmpty: { backgroundColor: AddyColors.paperDim },
  mood: { position: "absolute", right: -10, top: -12 },
  text: { flex: 1, gap: 2 },
  caption: {
    fontFamily: AddyFonts.bodyBold,
    fontSize: 14,
    lineHeight: 19,
    color: AddyColors.ink,
  },
  meta: {
    fontFamily: AddyFonts.body,
    fontSize: 12,
    lineHeight: 17,
    color: AddyColors.inkMuted,
  },
  button: { marginTop: 10 },
});
