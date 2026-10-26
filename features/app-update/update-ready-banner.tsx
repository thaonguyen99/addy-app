import { usePathname } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ChatBubbleBanner } from "@/components/ui/chat-bubble-banner";
import { AddyColors, AddyFonts } from "@/constants/theme";
import { restartIntoUpdate, useOtaUpdate } from "@/hooks/use-ota-update";
import { useInAppNotificationStore } from "@/stores/in-app-notification.store";

/** Screens where a restart would throw away a photo or an unsaved draft. */
const BUSY_PATHS = ["/capture", "/place-selection", "/create-pin", "/edit-memory"];

/**
 * Mounted once at the app root. When a new version has downloaded, offers a
 * restart instead of waiting for the next cold start. "Later" hides it until
 * the next launch, which applies the update anyway.
 */
export function UpdateReadyBanner() {
  const { isUpdatePending } = useOtaUpdate();
  const pathname = usePathname();
  const notificationVisible = useInAppNotificationStore((s) => s.visible);
  const [dismissed, setDismissed] = useState(false);

  const busy = BUSY_PATHS.some((path) => pathname.startsWith(path));
  const visible = isUpdatePending && !dismissed && !busy && !notificationVisible;

  return (
    <ChatBubbleBanner visible={visible} onPress={restartIntoUpdate}>
      <View style={styles.content}>
        <View style={styles.text}>
          <Text style={styles.title} numberOfLines={1}>
            ✨ A new version of Addy is ready
          </Text>
          <Text style={styles.body} numberOfLines={1}>
            Tap to restart, it only takes a second
          </Text>
        </View>
        <Pressable
          onPress={() => setDismissed(true)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Update later"
          style={({ pressed }) => [styles.later, pressed && styles.pressed]}
        >
          <Text style={styles.laterText}>Later</Text>
        </Pressable>
      </View>
    </ChatBubbleBanner>
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 16,
    paddingRight: 8,
    paddingVertical: 10,
  },
  text: { flex: 1, gap: 2 },
  title: {
    fontFamily: AddyFonts.titleSemiBold,
    fontSize: 15,
    letterSpacing: 0.2,
    color: AddyColors.ink,
  },
  body: { fontFamily: AddyFonts.body, fontSize: 13, color: AddyColors.inkMuted },
  later: { minHeight: 44, justifyContent: "center", paddingHorizontal: 10 },
  laterText: { fontFamily: AddyFonts.bodySemiBold, fontSize: 14, color: AddyColors.inkMuted },
  pressed: { opacity: 0.6 },
});
