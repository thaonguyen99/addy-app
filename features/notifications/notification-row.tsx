import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AddyColors, AddyFonts, AddyRadius } from "@/constants/theme";
import { PillButton } from "@/features/friends/components/pill-button";
import { ChatAvatar } from "@/features/memory/chat-avatar";
import { cloudinaryThumb } from "@/lib/cloudinary-thumb";
import {
  formatNotification,
  type NotificationDto,
} from "@/services/notifications";
import { formatRelativeTime } from "@/utils/format-relative-time";
import { leadActor } from "./notification-text";

const THUMB = 38;
/** Unread tint, from the moodboard. */
const UNREAD_BG = "#EAF6FF";

export type AcceptState = "idle" | "pending" | "done";

type NotificationRowProps = {
  row: NotificationDto;
  onPress: (row: NotificationDto) => void;
  /** FRIEND_REQUEST only. */
  onAccept?: (row: NotificationDto) => void;
  acceptState?: AcceptState;
};

/** One 🔔 row: who + what + when, the memory thumb on the right. */
export const NotificationRow = memo(function NotificationRow({
  row,
  onPress,
  onAccept,
  acceptState = "idle",
}: NotificationRowProps) {
  const unread = row.readAt === null;
  const { title, body } = formatNotification(row);
  const lead = leadActor(row);
  const rest = title.startsWith(lead) ? title.slice(lead.length) : ` ${title}`;

  return (
    <Pressable
      onPress={() => onPress(row)}
      accessibilityRole="button"
      accessibilityLabel={`${unread ? "Unread. " : ""}${title}`}
      style={({ pressed }) => [
        styles.row,
        unread && styles.unread,
        pressed && styles.pressed,
      ]}
    >
      {unread ? <View style={styles.dot} /> : null}
      <Avatars row={row} />
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={3}>
          <Text style={styles.lead}>{lead}</Text>
          {rest}
        </Text>
        {body ? (
          <Text style={styles.body} numberOfLines={2}>
            {body}
          </Text>
        ) : null}
        <Text style={styles.time}>{formatRelativeTime(row.updatedAt)}</Text>
      </View>
      {row.type === "FRIEND_REQUEST" && acceptState === "done" ? (
        <Text style={styles.chip}>friends ✓</Text>
      ) : row.type === "FRIEND_REQUEST" ? (
        <PillButton
          label="Accept"
          tone="cyan"
          loading={acceptState === "pending"}
          onPress={() => onAccept?.(row)}
          accessibilityLabel="Accept friend request"
        />
      ) : row.data.thumbUrl ? (
        <Image
          source={{ uri: cloudinaryThumb(row.data.thumbUrl, THUMB) }}
          style={styles.thumb}
          contentFit="cover"
        />
      ) : row.type === "FRIEND_ACCEPTED" ? (
        <Text style={styles.chip}>profile ›</Text>
      ) : null}
    </Pressable>
  );
});

/** One avatar, or the latest two overlapping for a grouped row. */
function Avatars({ row }: { row: NotificationDto }) {
  const [first, second] = row.actors;
  if (row.actorCount > 1 && first && second) {
    return (
      <View style={styles.duo}>
        <ChatAvatar user={first} size={24} />
        <View style={styles.duoSecond}>
          <ChatAvatar user={second} size={24} />
        </View>
      </View>
    );
  }
  return <ChatAvatar user={first ?? null} size={34} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
    paddingLeft: 12,
    paddingRight: 10,
    borderRadius: 14,
    marginBottom: 4,
  },
  unread: { backgroundColor: UNREAD_BG },
  pressed: { opacity: 0.7 },
  dot: {
    position: "absolute",
    left: 3,
    top: "50%",
    width: 6,
    height: 6,
    marginTop: -3,
    borderRadius: 3,
    backgroundColor: AddyColors.pink,
  },
  duo: { width: 34, height: 34 },
  duoSecond: {
    position: "absolute",
    right: 0,
    bottom: 0,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: AddyColors.white,
  },
  text: { flex: 1, minWidth: 0 },
  title: {
    fontFamily: AddyFonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: AddyColors.ink,
  },
  lead: { fontFamily: AddyFonts.bodyBold },
  body: {
    fontFamily: AddyFonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: AddyColors.inkMuted,
  },
  time: {
    fontFamily: AddyFonts.tech,
    fontSize: 15,
    color: AddyColors.inkMuted,
  },
  thumb: { width: THUMB, height: THUMB, borderRadius: 9 },
  chip: {
    fontFamily: AddyFonts.tech,
    fontSize: 15,
    color: AddyColors.ink,
    backgroundColor: AddyColors.paperDim,
    borderRadius: AddyRadius.chip,
    paddingHorizontal: 8,
    overflow: "hidden",
  },
});
