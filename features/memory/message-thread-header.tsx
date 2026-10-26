import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { StickerCard } from "@/components/ui/sticker-card";
import { AddyColors, AddyFonts, AddyRadius } from "@/constants/theme";

type MessageThreadHeaderProps = {
  isLoading: boolean;
  isError: boolean;
  isUnavailable: boolean;
  isEmpty: boolean;
  hasOlder: boolean;
  isLoadingOlder: boolean;
  onLoadOlder: () => void;
  onRetry: () => void;
};

/** Whatever sits between the memory post and the first message: loading,
 *  errors, "earlier messages", or the empty-chat nudge. */
export function MessageThreadHeader({
  isLoading,
  isError,
  isUnavailable,
  isEmpty,
  hasOlder,
  isLoadingOlder,
  onLoadOlder,
  onRetry,
}: MessageThreadHeaderProps) {
  return (
    <View style={styles.container}>
      {isUnavailable ? (
        <StickerCard
          radius={AddyRadius.card}
          borderStyle="dashed"
          shadow={false}
        >
          <View style={styles.card}>
            <Text style={styles.cardEmoji}>🫥</Text>
            <Text style={styles.cardText}>
              This chat isn&apos;t available anymore.
            </Text>
          </View>
        </StickerCard>
      ) : isLoading ? (
        <ActivityIndicator color={AddyColors.ink} style={styles.spinner} />
      ) : isError ? (
        <Pressable
          onPress={onRetry}
          style={styles.inlineRow}
          accessibilityRole="button"
        >
          <Text style={styles.meta}>
            couldn&apos;t load messages · tap to retry
          </Text>
        </Pressable>
      ) : hasOlder ? (
        <Pressable
          onPress={onLoadOlder}
          disabled={isLoadingOlder}
          style={styles.inlineRow}
          accessibilityRole="button"
          accessibilityLabel="Load earlier messages"
        >
          {isLoadingOlder ? (
            <ActivityIndicator color={AddyColors.ink} size="small" />
          ) : (
            <Text style={styles.meta}>↑ earlier messages</Text>
          )}
        </Pressable>
      ) : isEmpty ? (
        <Text style={[styles.meta, styles.emptyText]}>
          no messages yet · say something sweet ✦
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 10,
  },
  meta: {
    fontFamily: AddyFonts.tech,
    fontSize: 16,
    color: AddyColors.inkMuted,
  },
  card: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  cardEmoji: { fontSize: 28 },
  cardText: {
    fontFamily: AddyFonts.titleSemiBold,
    fontSize: 15,
    color: AddyColors.ink,
    textAlign: "center",
  },
  spinner: { paddingVertical: 12 },
  inlineRow: { alignItems: "center", paddingVertical: 6 },
  emptyText: { textAlign: "center", paddingVertical: 6 },
});
