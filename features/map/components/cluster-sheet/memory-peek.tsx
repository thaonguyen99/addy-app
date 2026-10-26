import { Image } from "expo-image";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";
import { MoodSticker } from "@/features/feed/mood-sticker";
import { cloudinaryThumb } from "@/lib/cloudinary-thumb";
import { useMemoryQuery, type ClusterMemory } from "@/services/memories";

import { formatPeekDate } from "./group-memories";

const MAX_CARD_WIDTH = 360;
const SOURCE_LABEL = { quick_snap: "⚡ quick snap", uploaded: "uploaded" };

type MemoryPeekProps = {
  memory: ClusterMemory | null;
  onClose: () => void;
  onOpen: (memory: ClusterMemory) => void;
  onShowOnMap: (memory: ClusterMemory) => void;
};

/**
 * Long-press preview of one cluster tile: a big photo, caption, where/when
 * and reaction/chat counts, without leaving the sheet. Counts and source
 * come from the memory's detail, which also warms the cache for "Open".
 */
export function MemoryPeek({
  memory,
  onClose,
  onOpen,
  onShowOnMap,
}: MemoryPeekProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - 48, MAX_CARD_WIDTH);
  const photoSize = cardWidth - 16;
  const { data: detail } = useMemoryQuery(memory?.id);
  const feeling = memory?.feeling ?? detail?.feeling;
  const source = detail?.source ? SOURCE_LABEL[detail.source] : null;

  return (
    <Modal
      visible={memory !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.scrim}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close preview"
      >
        {memory ? (
          // Swallows taps so only the scrim outside the card dismisses.
          <Pressable style={[styles.card, { width: cardWidth }]} onPress={() => {}}>
            <View style={{ width: photoSize, height: photoSize }}>
              <Image
                source={{ uri: cloudinaryThumb(memory.imageUrl, photoSize) }}
                style={[StyleSheet.absoluteFill, styles.photo]}
                contentFit="cover"
              />
              <View style={styles.sticker} pointerEvents="none">
                <MoodSticker score={memory.moodScore} size={44} seed={memory.id} />
              </View>
            </View>
            <View style={styles.body}>
              {feeling ? (
                <Text style={styles.caption} numberOfLines={3}>
                  {feeling}
                </Text>
              ) : null}
              <Text style={styles.meta}>
                📍 {memory.placeName} · {formatPeekDate(memory.capturedAt)}
                {source ? ` · ${source}` : ""}
              </Text>
              <Text style={styles.meta}>
                ♥ {detail ? detail.reactionCount : "–"} · 💬{" "}
                {detail ? detail.messageCount : "–"}
              </Text>
            </View>
            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                onPress={() => onOpen(memory)}
                accessibilityRole="button"
              >
                <Text style={styles.actionPrimary}>💬 Open</Text>
              </Pressable>
              <View style={styles.divider} />
              <Pressable
                style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                onPress={() => onShowOnMap(memory)}
                accessibilityRole="button"
              >
                <Text style={styles.actionText}>🗺️ Show on map</Text>
              </Pressable>
            </View>
          </Pressable>
        ) : null}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(22, 23, 26, 0.45)",
  },
  card: {
    padding: 8,
    borderRadius: AddyRadius.card,
    backgroundColor: AddyColors.paper,
    ...AddyShadow.raised,
  },
  photo: { borderRadius: AddyRadius.photo },
  sticker: { position: "absolute", top: -18, right: -14 },
  body: { paddingHorizontal: 8, paddingTop: 10, paddingBottom: 8, gap: 2 },
  caption: {
    fontFamily: AddyFonts.title,
    fontSize: 20,
    lineHeight: 26,
    color: AddyColors.ink,
  },
  meta: {
    fontFamily: AddyFonts.tech,
    fontSize: 18,
    lineHeight: 22,
    color: AddyColors.inkMuted,
  },
  actions: {
    flexDirection: "row",
    borderTopWidth: ADDY_BORDER_WIDTH,
    borderTopColor: AddyColors.line,
  },
  action: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  divider: { width: ADDY_BORDER_WIDTH, backgroundColor: AddyColors.line },
  actionPrimary: {
    fontFamily: AddyFonts.bodyBold,
    fontSize: 15,
    color: AddyColors.ink,
  },
  actionText: {
    fontFamily: AddyFonts.bodyMedium,
    fontSize: 15,
    color: AddyColors.ink,
  },
  pressed: { opacity: 0.6 },
});
