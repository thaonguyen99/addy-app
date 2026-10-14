import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ChatBubbleBanner } from "@/components/ui/chat-bubble-banner";
import { BrandColors } from "@/constants/theme";
import { useInAppNotificationStore } from "@/features/notifications/in-app-notification-store";

/** Mounted once at the app root; Addy-styled stand-in for the OS banner while the app is open. */
export function InAppNotificationBanner() {
  const notification = useInAppNotificationStore((s) => s.notification);
  const visible = useInAppNotificationStore((s) => s.visible);
  const hide = useInAppNotificationStore((s) => s.hide);

  const onPress = () => {
    hide();
    if (notification?.path) router.push(notification.path as never);
  };

  return (
    <ChatBubbleBanner visible={visible && !!notification} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {notification?.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {notification?.body}
        </Text>
      </View>
    </ChatBubbleBanner>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 2,
  },
  title: {
    color: BrandColors.ink,
    fontSize: 15,
    fontFamily: "Baloo2-SemiBold",
    letterSpacing: 0.2,
  },
  body: {
    color: BrandColors.inkMuted,
    fontSize: 13,
    fontFamily: "BeVietnam-Regular",
  },
});
