import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { StickerBorderWidth } from "@/constants/sticker-style";
import { BrandColors } from "@/constants/theme";
import { formatRelativeTime } from "@/features/feed/utils/format-relative-time";
import type { MemoryMessage } from "@/types/api";

/** Light cyan for the viewer's own messages on someone else's memory. */
const MINE_BUBBLE_COLOR = "#CDEFFF";
const AVATAR_SIZE = 30;

export type MessageBubbleVariant = "owner" | "mine" | "other";

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
  viewerIsMemoryOwner: boolean;
  onToggleLike?: (message: MemoryMessage) => void;
  onLongPress?: (message: MemoryMessage) => void;
  onRetry?: (clientId: string) => void;
};

function variantFor(
  item: ThreadItem,
  viewerId: string | undefined,
  viewerIsMemoryOwner: boolean,
): MessageBubbleVariant {
  if (item.kind === "pending") return viewerIsMemoryOwner ? "owner" : "mine";
  const { message } = item;
  if (message.isOwnerOfMemory) return "owner";
  if (viewerId && message.author?.id === viewerId) return "mine";
  return "other";
}

function Avatar({ author }: { author: MemoryMessage["author"] }) {
  return (
    <View style={styles.avatar}>
      {author?.avatarUrl ? (
        <Image
          source={{ uri: author.avatarUrl }}
          style={styles.avatarImage}
          contentFit="cover"
        />
      ) : author ? (
        <Text style={styles.avatarInitial}>
          {author.username.charAt(0).toUpperCase()}
        </Text>
      ) : (
        <Ionicons name="person" size={14} color={BrandColors.inkMuted} />
      )}
    </View>
  );
}

export const MessageBubble = memo(function MessageBubble({
  item,
  viewerId,
  viewerIsMemoryOwner,
  onToggleLike,
  onLongPress,
  onRetry,
}: MessageBubbleProps) {
  const variant = variantFor(item, viewerId, viewerIsMemoryOwner);
  const message = item.kind === "message" ? item.message : null;
  const isMine =
    item.kind === "pending" ||
    (viewerId !== undefined && message?.author?.id === viewerId);

  const name = isMine ? "you" : (message?.author?.username ?? "someone");
  const createdAt = message?.createdAt ?? (item.kind === "pending" ? item.createdAt : "");
  const failed = item.kind === "pending" && item.status === "failed";
  const sending = item.kind === "pending" && item.status === "sending";
  const alignRight = variant === "owner";

  const bubble = (
    <Pressable
      onLongPress={message && onLongPress ? () => onLongPress(message) : undefined}
      onPress={failed && onRetry ? () => onRetry(item.clientId) : undefined}
      delayLongPress={300}
      accessibilityHint={failed ? "Tap to retry sending" : undefined}
      style={[
        styles.bubble,
        variant === "owner" && styles.bubbleOwner,
        variant === "mine" && styles.bubbleMine,
        variant === "other" && styles.bubbleOther,
        sending && styles.bubbleSending,
        failed && styles.bubbleFailed,
      ]}
    >
      <Text style={styles.text}>
        {message?.text ?? (item.kind === "pending" ? item.text : "")}
      </Text>
    </Pressable>
  );

  return (
    <View style={[styles.row, alignRight ? styles.rowRight : styles.rowLeft]}>
      {variant === "other" ? <Avatar author={message?.author ?? null} /> : null}
      <View style={[styles.column, alignRight ? styles.columnRight : styles.columnLeft]}>
        <View style={styles.metaRow}>
          <Text style={styles.meta} numberOfLines={1}>
            {name}
            {createdAt ? ` · ${formatRelativeTime(createdAt)}` : ""}
            {message?.editedAt ? " · edited" : ""}
          </Text>
          {variant === "owner" ? <Text style={styles.ownerTag}>✦ owner</Text> : null}
        </View>

        {bubble}

        {failed ? (
          <Pressable onPress={() => onRetry?.(item.clientId)} hitSlop={6}>
            <Text style={styles.failedText}>not sent — tap to retry</Text>
          </Pressable>
        ) : sending ? (
          <Text style={styles.meta}>sending…</Text>
        ) : message ? (
          <Pressable
            onPress={() => onToggleLike?.(message)}
            hitSlop={8}
            style={styles.likeRow}
            accessibilityRole="button"
            accessibilityLabel={message.likedByMe ? "Unlike message" : "Like message"}
          >
            <Text style={[styles.likeIcon, message.likedByMe && styles.likeIconOn]}>
              {message.likedByMe ? "♥" : "♡"}
            </Text>
            <Text style={styles.meta}>
              {message.likeCount > 0 ? message.likeCount : "like"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },
  column: { maxWidth: "78%", gap: 2 },
  columnLeft: { alignItems: "flex-start" },
  columnRight: { alignItems: "flex-end" },

  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: BrandColors.ink,
    backgroundColor: BrandColors.gray100,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginTop: 16,
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitial: {
    fontFamily: "Fredoka-SemiBold",
    fontSize: 13,
    color: BrandColors.ink,
  },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  meta: {
    fontFamily: "VT323-Regular",
    fontSize: 13,
    color: BrandColors.inkMuted,
  },
  ownerTag: {
    fontFamily: "Fredoka-SemiBold",
    fontSize: 11,
    color: BrandColors.ink,
  },

  bubble: {
    borderWidth: StickerBorderWidth.thin,
    borderColor: BrandColors.ink,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleOwner: {
    backgroundColor: BrandColors.primaryLight,
    borderBottomRightRadius: 4,
  },
  bubbleMine: {
    backgroundColor: MINE_BUBBLE_COLOR,
    borderBottomLeftRadius: 4,
  },
  bubbleOther: {
    backgroundColor: BrandColors.white,
    borderBottomLeftRadius: 4,
  },
  bubbleSending: { opacity: 0.6 },
  bubbleFailed: { borderColor: BrandColors.danger, borderStyle: "dashed" },
  text: {
    fontFamily: "BeVietnam-Regular",
    fontSize: 15,
    lineHeight: 20,
    color: BrandColors.ink,
  },

  likeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  likeIcon: { fontSize: 14, color: BrandColors.inkMuted },
  likeIconOn: { color: BrandColors.accentPink },
  failedText: {
    fontFamily: "VT323-Regular",
    fontSize: 13,
    color: BrandColors.danger,
  },
});
