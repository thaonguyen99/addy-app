import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { ChatBubbleBanner } from "@/components/ui/chat-bubble-banner";
import { AddyColors, AddyFonts } from "@/constants/theme";
import { ChatAvatar } from "@/features/memory/chat-avatar";
import { openNotificationTarget } from "@/features/notifications/notification-target";
import { cloudinaryThumb } from "@/lib/cloudinary-thumb";
import { useInAppNotificationStore } from "@/stores/in-app-notification.store";

const THUMB = 38;

/** Mounted once at the app root; Addy-styled stand-in for the OS banner while the app is open. */
export function InAppNotificationBanner() {
  const notification = useInAppNotificationStore((s) => s.notification);
  const visible = useInAppNotificationStore((s) => s.visible);
  const hide = useInAppNotificationStore((s) => s.hide);

  const onPress = () => {
    hide();
    if (notification?.target) void openNotificationTarget(notification.target);
  };

  const title = notification?.title ?? "";
  const lead =
    notification?.lead && title.startsWith(notification.lead)
      ? notification.lead
      : "";

  return (
    <ChatBubbleBanner visible={visible && !!notification} onPress={onPress}>
      <View style={styles.content}>
        {notification?.actor ? (
          <ChatAvatar user={notification.actor} size={34} />
        ) : null}
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={2}>
            {lead ? <Text style={styles.lead}>{lead}</Text> : null}
            {title.slice(lead.length)}
          </Text>
          {notification?.body ? (
            <Text style={styles.body} numberOfLines={2}>
              {notification.body}
            </Text>
          ) : null}
        </View>
        {notification?.thumbUrl ? (
          <Image
            source={{ uri: cloudinaryThumb(notification.thumbUrl, THUMB) }}
            style={styles.thumb}
            contentFit="cover"
          />
        ) : null}
      </View>
    </ChatBubbleBanner>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: { flex: 1, gap: 2 },
  title: {
    color: AddyColors.ink,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: AddyFonts.body,
  },
  lead: { fontFamily: AddyFonts.bodyBold },
  body: {
    color: AddyColors.inkMuted,
    fontSize: 13,
    fontFamily: AddyFonts.body,
  },
  thumb: { width: THUMB, height: THUMB, borderRadius: 9 },
});
