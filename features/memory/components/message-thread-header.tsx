import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { StickerCard } from "@/components/ui/sticker-card";
import { StickerRadius } from "@/constants/sticker-style";
import { BrandColors } from "@/constants/theme";

type MessageThreadHeaderProps = {
  messageCount: number;
  isLoading: boolean;
  isError: boolean;
  isUnavailable: boolean;
  isEmpty: boolean;
  hasOlder: boolean;
  isLoadingOlder: boolean;
  onLoadOlder: () => void;
  onRetry: () => void;
};

/** "Psst..." label + count, and whatever sits above the first bubble. */
export function MessageThreadHeader({
  messageCount,
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
      <View style={styles.labelRow}>
        <Text style={styles.label}>Psst...</Text>
        <Text style={styles.meta}>{messageCount} · friends only</Text>
      </View>

      {isUnavailable ? (
        <StickerCard radius={StickerRadius.card} borderStyle="dashed" shadow={false}>
          <View style={styles.card}>
            <Text style={styles.cardEmoji}>🫥</Text>
            <Text style={styles.cardText}>This chat isn&apos;t available anymore.</Text>
          </View>
        </StickerCard>
      ) : isLoading ? (
        <ActivityIndicator color={BrandColors.ink} style={styles.spinner} />
      ) : isError ? (
        <Pressable onPress={onRetry} style={styles.inlineRow} accessibilityRole="button">
          <Text style={styles.meta}>couldn&apos;t load messages · tap to retry</Text>
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
            <ActivityIndicator color={BrandColors.ink} size="small" />
          ) : (
            <Text style={styles.meta}>↑ earlier messages</Text>
          )}
        </Pressable>
      ) : isEmpty ? (
        <Text style={[styles.meta, styles.emptyText]}>
          no messages yet — start the gossip ✦
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 8,
    gap: 10,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  label: {
    fontFamily: "Fredoka-Bold",
    fontSize: 22,
    color: BrandColors.ink,
  },
  meta: {
    fontFamily: "VT323-Regular",
    fontSize: 16,
    color: BrandColors.inkMuted,
  },
  card: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  cardEmoji: { fontSize: 28 },
  cardText: {
    fontFamily: "Fredoka-SemiBold",
    fontSize: 15,
    color: BrandColors.ink,
    textAlign: "center",
  },
  spinner: { paddingVertical: 12 },
  inlineRow: { alignItems: "center", paddingVertical: 6 },
  emptyText: { textAlign: "center", paddingVertical: 6 },
});
