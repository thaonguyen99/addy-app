import { memo, useCallback, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { ADDY_BORDER_WIDTH, AddyColors, AddyFonts } from "@/constants/theme";
import { ChatAvatar } from "@/features/memory/chat-avatar";
import {
  HEART_CHIP_OVERHANG,
  HeartChip,
  Likeable,
} from "@/features/memory/likeable";
import type { MemoryMessage } from "@/services/messages";
import { formatRelativeTime } from "@/utils/format-relative-time";
import { splitMentions } from "@/utils/mentions";

const AVATAR_SIZE = 30;
/** Pale pink wash behind a message opened from a notification. */
const HIGHLIGHT_COLOR = "rgba(255, 92, 174, 0.14)";
const HIGHLIGHT_HOLD_MS = 900;
const HIGHLIGHT_FADE_MS = 600;

/** Mine = right, lime. Other = left, white, with avatar — like any chat. */
export type MessageBubbleVariant = "mine" | "other";

/** A row in the thread: a server message, or a local send still in flight. */
export type ThreadItem =
  | { kind: "message"; message: MemoryMessage }
  | {
      kind: "pending";
      clientId: string;
      text: string;
      createdAt: string;
      status: "sending" | "failed";
    };

type MessageBubbleProps = {
  item: ThreadItem;
  viewerId: string | undefined;
  onToggleLike?: (message: MemoryMessage) => void;
  onLongPress?: (message: MemoryMessage) => void;
  onRetry?: (clientId: string) => void;
  /** Tap the author's avatar or name, or an @mention, to open that profile. */
  onOpenProfile?: (username: string) => void;
  /** Opened from a notification: briefly wash the row pink. */
  highlighted?: boolean;
  /** Arrived live: a soft slide-up on mount. */
  animateIn?: boolean;
};

function variantFor(
  item: ThreadItem,
  viewerId: string | undefined,
): MessageBubbleVariant {
  if (item.kind === "pending") return "mine";
  return viewerId && item.message.author?.id === viewerId ? "mine" : "other";
}

export const MessageBubble = memo(function MessageBubble({
  item,
  viewerId,
  onToggleLike,
  onLongPress,
  onRetry,
  onOpenProfile,
  highlighted = false,
  animateIn = false,
}: MessageBubbleProps) {
  const variant = variantFor(item, viewerId);
  const highlight = useSharedValue(0);
  useEffect(() => {
    if (!highlighted) return;
    highlight.value = 1;
    highlight.value = withDelay(
      HIGHLIGHT_HOLD_MS,
      withTiming(0, { duration: HIGHLIGHT_FADE_MS }),
    );
  }, [highlighted, highlight]);
  const highlightStyle = useAnimatedStyle(() => ({
    opacity: highlight.value,
  }));
  const mine = variant === "mine";
  const message = item.kind === "message" ? item.message : null;
  const createdAt =
    message?.createdAt ?? (item.kind === "pending" ? item.createdAt : "");
  const failed = item.kind === "pending" && item.status === "failed";
  const sending = item.kind === "pending" && item.status === "sending";
  const likeCount = message?.likeCount ?? 0;
  // A null author blocked the viewer: nothing to open.
  const author = message?.author ?? null;
  const openAuthor =
    author && onOpenProfile ? () => onOpenProfile(author.username) : undefined;

  const toggleLike = useCallback(() => {
    if (message) onToggleLike?.(message);
  }, [message, onToggleLike]);
  const longPress = useCallback(() => {
    if (message) onLongPress?.(message);
  }, [message, onLongPress]);
  const retry = useCallback(() => {
    if (item.kind === "pending" && failed) onRetry?.(item.clientId);
  }, [item, failed, onRetry]);

  const text = message
    ? splitMentions(message.text, message.mentions ?? []).map((segment, i) =>
        segment.mention ? (
          // Fires on tap-up, before the bubble's double-tap / long-press
          // gestures activate, so a long press still opens the menu.
          <Text
            key={i}
            style={styles.mention}
            onPress={
              onOpenProfile
                ? () => onOpenProfile(segment.text.slice(1))
                : undefined
            }
            accessibilityRole="link"
          >
            {segment.text}
          </Text>
        ) : (
          segment.text
        ),
      )
    : item.kind === "pending"
      ? item.text
      : null;

  return (
    <Animated.View
      entering={animateIn ? FadeInDown.duration(220) : undefined}
      style={[
        styles.row,
        mine ? styles.rowRight : styles.rowLeft,
        likeCount > 0 && styles.rowWithChip,
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.highlight, highlightStyle]}
      />
      {mine ? null : (
        <Pressable
          onPress={openAuthor}
          disabled={!openAuthor}
          accessibilityRole={openAuthor ? "button" : undefined}
          accessibilityLabel={author ? `Open ${author.username}'s profile` : undefined}
          style={styles.avatarSlot}
        >
          <ChatAvatar user={author} size={AVATAR_SIZE} />
        </Pressable>
      )}
      <View
        style={[styles.column, mine ? styles.columnRight : styles.columnLeft]}
      >
        <View style={styles.metaRow}>
          {mine ? null : (
            <Text style={styles.name} numberOfLines={1} onPress={openAuthor}>
              {author?.username ?? "someone"}
            </Text>
          )}
          {!mine && message?.isOwnerOfMemory ? (
            <Text style={styles.ownerTag}>✦ owner</Text>
          ) : null}
          <Text style={styles.meta}>
            {sending
              ? "sending…"
              : `${createdAt ? formatRelativeTime(createdAt) : ""}${message?.editedAt ? " · edited" : ""}`}
          </Text>
        </View>

        <Likeable
          liked={message?.likedByMe ?? false}
          onToggleLike={toggleLike}
          onLongPress={message && onLongPress ? longPress : undefined}
          onTap={failed ? retry : undefined}
          accessibilityLabel={
            message
              ? `${mine ? "You" : (message.author?.username ?? "Someone")}: ${message.text}`
              : undefined
          }
          style={[
            styles.bubble,
            mine ? styles.bubbleMine : styles.bubbleOther,
            sending && styles.bubbleSending,
            failed && styles.bubbleFailed,
          ]}
        >
          <Text style={styles.text}>{text}</Text>
          {message ? (
            <HeartChip
              count={likeCount}
              liked={message.likedByMe}
              side="right"
              onPress={toggleLike}
              accessibilityLabel={`${likeCount} likes. ${message.likedByMe ? "Unlike" : "Like"} message`}
            />
          ) : null}
        </Likeable>

        {failed ? (
          <Pressable onPress={retry} hitSlop={8} accessibilityRole="button">
            <Text style={styles.failedText}>not sent · tap to retry</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  rowWithChip: { marginBottom: 10 + HEART_CHIP_OVERHANG },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    top: -5,
    bottom: -5,
    backgroundColor: HIGHLIGHT_COLOR,
  },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },
  avatarSlot: { paddingBottom: 2 },
  column: { maxWidth: "78%", gap: 3 },
  columnLeft: { alignItems: "flex-start" },
  columnRight: { alignItems: "flex-end" },
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
    borderWidth: ADDY_BORDER_WIDTH,
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  bubbleMine: {
    backgroundColor: AddyColors.lime,
    borderColor: AddyColors.limeDeep,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: AddyColors.white,
    borderColor: AddyColors.line,
    borderBottomLeftRadius: 4,
  },
  bubbleSending: { opacity: 0.6 },
  bubbleFailed: { borderColor: AddyColors.danger, borderStyle: "dashed" },
  text: {
    fontFamily: AddyFonts.body,
    fontSize: 15,
    lineHeight: 21,
    color: AddyColors.ink,
  },
  mention: {
    fontFamily: AddyFonts.bodySemiBold,
    color: AddyColors.pink,
  },
  failedText: {
    fontFamily: AddyFonts.tech,
    fontSize: 15,
    color: AddyColors.danger,
  },
});
