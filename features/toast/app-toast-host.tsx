import { StyleSheet, Text } from "react-native";

import { ChatBubbleBanner } from "@/components/ui/chat-bubble-banner";
import { BrandColors } from "@/constants/theme";
import { useToastStore } from "@/features/toast/toast-store";

/** Mounted once at the app root; shows whatever `showToast` last queued. */
export function AppToastHost() {
  const message = useToastStore((s) => s.message);
  const visible = useToastStore((s) => s.visible);
  const hide = useToastStore((s) => s.hide);

  return (
    <ChatBubbleBanner visible={visible && !!message} onPress={hide}>
      <Text style={styles.text}>{message}</Text>
    </ChatBubbleBanner>
  );
}

const styles = StyleSheet.create({
  text: {
    color: BrandColors.ink,
    fontSize: 14,
    fontFamily: "Fredoka-SemiBold",
    letterSpacing: 0.2,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});
