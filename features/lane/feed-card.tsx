import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { TechChip } from "@/components/ui/tech-chip";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyGradients,
  AddyShadow,
} from "@/constants/theme";
import { MOOD_SCORE_OPTIONS } from "@/features/camera/constants/mood-score";
import { ChatAvatar } from "@/features/memory/chat-avatar";
import { openProfile } from "@/features/profile/open-profile";
import type { FeedItem } from "@/services/feed";
import { formatClockTime } from "@/utils/format-relative-time";
import { FeedPhoto } from "./feed-photo";
import { type CardRect, measureView, registerCard } from "./zoom-transition";

export const FEED_CARD_RADIUS = 16;
const AVATAR_SIZE = 28;

type FeedCardProps = {
  item: FeedItem;
  /** Card width; the photo is a full-width square. */
  width: number;
  /** Double tap on the photo: only ever likes. */
  onLike: (item: FeedItem) => void;
  /** Heart tap: likes, or unlikes. */
  onToggleLike: (item: FeedItem) => void;
  /** Opens the chat, zooming out of `rect` (the card on screen). */
  onOpen: (id: string, rect: CardRect | null) => void;
  onOpenMap: (item: FeedItem) => void;
};

function moodEmoji(score: number | null): string | null {
  return MOOD_SCORE_OPTIONS.find((o) => o.score === score)?.emoji ?? null;
}

/** One Memory Lane post: who/where strip, photo, caption, tag and last comment. */
export const FeedCard = memo(function FeedCard({
  item,
  width,
  onLike,
  onToggleLike,
  onOpen,
  onOpenMap,
}: FeedCardProps) {
  const { owner, isMine } = item;
  const emoji = moodEmoji(item.moodScore);
  const photoSize = width - ADDY_BORDER_WIDTH * 2;
  const photoUrls = useMemo(
    () => (item.photoUrls?.length ? item.photoUrls : [item.photoUrl]),
    [item.photoUrls, item.photoUrl],
  );
  const like = useCallback(() => onLike(item), [onLike, item]);

  // The chat zooms out of this card's rect, and back into it on close.
  const cardRef = useRef<View>(null);
  useEffect(() => registerCard(item.id, () => cardRef.current), [item.id]);
  const open = useCallback(() => {
    void measureView(cardRef.current).then((rect) => onOpen(item.id, rect));
  }, [onOpen, item.id]);
  const openOwner = () => openProfile(owner.username);
  const extraTags = item.tagCount - 1;

  return (
    <View ref={cardRef} style={[styles.card, AddyShadow.soft, { width }]}>
      <View style={styles.clip}>
        <Pressable
          onPress={open}
          accessibilityRole="button"
          accessibilityHint="Opens the memory chat"
        >
          <LinearGradient
            colors={isMine ? AddyGradients.laneMine : AddyGradients.laneFriend}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.strip}
          >
            <Pressable
              onPress={openOwner}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Open ${isMine ? "your" : `${owner.username}'s`} profile`}
            >
              <ChatAvatar user={owner} size={AVATAR_SIZE} />
            </Pressable>
            <View style={styles.stripText}>
              <Text style={styles.who} numberOfLines={1}>
                <Text style={styles.name} onPress={openOwner}>
                  {isMine ? "you" : owner.username}
                </Text>
                {emoji ? `${isMine ? " are" : " is"} feeling ${emoji}` : ""}
                {isMine && item.visibility === "private" ? " 🔒" : ""}
              </Text>
              {/* Split so a long place name truncates but the time stays. */}
              <View style={styles.whereRow}>
                <Text style={[styles.where, styles.shrink]} numberOfLines={1}>
                  📍 {item.place.name}
                </Text>
                <Text style={styles.where}>
                  {" "}
                  · {formatClockTime(item.createdAt)}
                </Text>
              </View>
            </View>
            <TechChip
              label="map"
              trailing="›"
              size="sm"
              onPress={() => onOpenMap(item)}
              accessibilityLabel={`Show ${item.place.name} on the map`}
            />
          </LinearGradient>
        </Pressable>

        <FeedPhoto
          id={item.id}
          urls={photoUrls}
          size={photoSize}
          onLike={like}
          onTap={open}
          accessibilityLabel={`${isMine ? "Your" : `${owner.username}'s`} memory at ${item.place.name}`}
        />

        <Pressable onPress={open} style={styles.body}>
          <View style={styles.footer}>
            <Text style={styles.caption} numberOfLines={1}>
              {item.caption ?? ""}
            </Text>
            {/* Icon and number side by side, centered: nested in one Text
                they'd sit on different font baselines. */}
            <Pressable
              onPress={() => onToggleLike(item)}
              hitSlop={10}
              style={styles.countRow}
              accessibilityRole="button"
              accessibilityLabel={`${item.likeCount} likes. ${item.likedByMe ? "Unlike" : "Like"}`}
            >
              <Ionicons
                name="heart"
                size={15}
                color={item.likedByMe ? AddyColors.pink : AddyColors.inkMuted}
              />
              <Text style={styles.count}>{item.likeCount}</Text>
            </Pressable>
            <View
              style={styles.countRow}
              accessible
              accessibilityLabel={`${item.commentCount} comments`}
            >
              <Text style={styles.countEmoji}>💬</Text>
              <Text style={styles.count}>{item.commentCount}</Text>
            </View>
          </View>

          {item.firstTag ? (
            <Text style={styles.line} numberOfLines={1}>
              with{" "}
              <Text
                style={styles.name}
                onPress={() => openProfile(item.firstTag!.username)}
              >
                {item.firstTag.username}
              </Text>
              {extraTags > 0 ? ` +${extraTags}` : ""}
            </Text>
          ) : null}

          {item.latestComment ? (
            <Text style={[styles.line, styles.muted]} numberOfLines={1}>
              {item.latestComment.author ? (
                <Text style={styles.name}>
                  {item.latestComment.author.username}{" "}
                </Text>
              ) : null}
              {item.latestComment.text}
            </Text>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    alignSelf: "center",
    borderRadius: FEED_CARD_RADIUS,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  // Clips the strip and photo to the corners; the shadow stays on `card`.
  clip: {
    borderRadius: FEED_CARD_RADIUS - ADDY_BORDER_WIDTH,
    overflow: "hidden",
  },
  strip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  stripText: { flex: 1, minWidth: 0 },
  who: {
    fontFamily: AddyFonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: AddyColors.ink,
  },
  name: { fontFamily: AddyFonts.bodyBold, color: AddyColors.ink },
  whereRow: { flexDirection: "row" },
  shrink: { flexShrink: 1 },
  where: {
    fontFamily: AddyFonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: AddyColors.inkMuted,
  },
  body: { paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
  footer: { flexDirection: "row", alignItems: "center", gap: 10 },
  caption: {
    flex: 1,
    fontFamily: AddyFonts.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    color: AddyColors.ink,
  },
  count: {
    fontFamily: AddyFonts.tech,
    fontSize: 18,
    lineHeight: 20,
    color: AddyColors.ink,
  },
  countRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  countEmoji: { fontSize: 14, lineHeight: 18 },
  line: {
    fontFamily: AddyFonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: AddyColors.ink,
  },
  muted: { color: AddyColors.inkMuted },
});
