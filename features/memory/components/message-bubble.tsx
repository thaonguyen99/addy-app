import { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
} from "@/constants/theme";
import { formatRelativeTime } from "@/features/feed/utils/format-relative-time";
import { ChatAvatar } from "@/features/memory/components/chat-avatar";
import {
  HEART_CHIP_OVERHANG,
  HeartChip,
  Likeable,
} from "@/features/memory/components/likeable";
import { splitMentions } from "@/features/memory/utils/mentions";
import type { MemoryMessage } from "@/types/api";

const AVATAR_SIZE = 30;

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
};

function variantFor(item: ThreadItem, viewerId: string | undefined): MessageBubbleVariant {
  if (item.kind === "pending") return "mine";
  return viewerId && item.message.author?.id === viewerId ? "mine" : "other";
}

export const MessageBubble = memo(function MessageBubble({
  item,
  viewerId,
  onToggleLike,
  onLongPress,
  onRetry,
}: MessageBubbleProps) {
  const variant = variantFor(item, viewerId);
  const mine = variant === "mine";
  const message = item.kind === "message" ? item.message : null;

  const createdAt = message?.createdAt ?? (item.kind === "pending" ? item.createdAt : "");
  const failed = item.kind === "pending" && item.status === "failed";
  const sending = item.kind === "pending" && item.status === "sending";
  const likeCount = message?.likeCount ?? 0;

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
          <Text key={i} style={styles.mention}>
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
    <View
      style={[
        styles.row,
        mine ? styles.rowRight : styles.rowLeft,
        likeCount > 0 && styles.rowWithChip,
      ]}
    >
      {mine ? null : (
        <View style={styles.avatarSlot}>
          <ChatAvatar user={message?.author ?? null} size={AVATAR_SIZE} />
        </View>
      )}
      <View style={[styles.column, mine ? styles.columnRight : styles.columnLeft]}>
        <View style={styles.metaRow}>
          {mine ? null : (
            <Text style={styles.name} numberOfLines={1}>
              {message?.author?.username ?? "someone"}
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
    </View>
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
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },
  avatarSlot: { paddingBottom: 2 },
  column: { maxWidth: "78%", gap: 3 },
  columnLeft: { alignItems: "flex-start" },
  columnRight: { alignItems: "flex-end" },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 4 },
  name: {
    fontFamily: AddyFonts.titleSemiBold,
    fontSize: 13,
    color: AddyColors.ink,
    flexShrink: 1,
  },
  ownerTag: {
    fontFamily: AddyFonts.tech,
    fontSize: 15,
    color: AddyColors.limeDeep,
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
  // 16/16/4/16 — the tail corner points at the sender.
  bubbleMine: {
    backgroundColor: AddyColors.lime,
    borderColor: AddyColors.limeDeep,
    borderBottomRightRadius: 4,
  },
  // 16/16/16/4
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
