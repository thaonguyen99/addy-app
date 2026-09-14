import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StickerCard } from "@/components/ui/sticker-card";
import { BrandColors } from "@/constants/theme";
import { StickerRadius } from "@/constants/sticker-style";
import { MOOD_SCORE_OPTIONS } from "@/features/camera/constants/mood-score";
import { useMemoryFeed } from "@/features/feed/hooks/use-memory-feed";
import { pickCover } from "@/features/feed/utils/pick-cover";
import type { MemoryListItem } from "@/types/api";

export type AllMemoriesSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type AllMemoriesSheetProps = {
  onSelectPin: (latitude: number, longitude: number) => void;
};

function moodEmoji(score: number | null): string | null {
  if (score === null) return null;
  return MOOD_SCORE_OPTIONS.find((o) => o.score === score)?.emoji ?? null;
}

/**
 * The map's "N memories ›" chip expands this in place — it IS the memory
 * list, no separate screen. Tapping a row pans/zooms the map to that pin.
 */
export const AllMemoriesSheet = forwardRef<AllMemoriesSheetRef, AllMemoriesSheetProps>(
  function AllMemoriesSheet({ onSelectPin }, ref) {
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<BottomSheetModal>(null);
    const [active, setActive] = useState(false);
    const { items, isLoading } = useMemoryFeed(active);

    useImperativeHandle(
      ref,
      () => ({
        present: () => sheetRef.current?.present(),
        dismiss: () => sheetRef.current?.dismiss(),
      }),
      [],
    );

    const onPressItem = useCallback(
      (item: MemoryListItem) => {
        onSelectPin(item.place.latitude, item.place.longitude);
        sheetRef.current?.dismiss();
      },
      [onSelectPin],
    );

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          pressBehavior="close"
        />
      ),
      [],
    );

    const renderItem = useCallback(
      ({ item }: { item: MemoryListItem }) => {
        const cover = pickCover(item.images);
        const emoji = moodEmoji(item.moodScore);
        return (
          <Pressable
            onPress={() => onPressItem(item)}
            accessibilityRole="button"
            accessibilityLabel={`Pan map to ${item.place.name}`}
          >
            <StickerCard radius={StickerRadius.button} shadowOffset={2}>
              <View style={styles.row}>
                {cover ? (
                  <Image
                    source={{ uri: cover.url }}
                    style={styles.thumb}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.thumb, styles.thumbFallback]}>
                    <Text style={styles.thumbFallbackText}>📷</Text>
                  </View>
                )}
                <View style={styles.textWrap}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {item.feeling?.trim() || item.place.name}
                  </Text>
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {item.place.name}
                  </Text>
                </View>
                {emoji ? (
                  <View style={styles.moodBadge}>
                    <Text style={styles.moodEmoji}>{emoji}</Text>
                  </View>
                ) : null}
              </View>
            </StickerCard>
          </Pressable>
        );
      },
      [onPressItem],
    );

    const listData = useMemo(() => items, [items]);

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={["55%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        topInset={insets.top}
        onChange={(index) => setActive(index >= 0)}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Your memories</Text>
        </View>
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={BrandColors.primary} />
          </View>
        ) : (
          <BottomSheetFlatList
            data={listData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={
              <Text style={styles.empty}>No memories yet.</Text>
            }
          />
        )}
      </BottomSheetModal>
    );
  },
);

const THUMB_SIZE = 52;

const styles = StyleSheet.create({
  background: { backgroundColor: BrandColors.paper },
  handleIndicator: { backgroundColor: BrandColors.ink, width: 40 },
  titleRow: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BrandColors.stroke2,
  },
  title: { color: BrandColors.ink, fontSize: 15, fontFamily: "Fredoka-SemiBold" },
  center: { padding: 40, alignItems: "center" },
  list: { padding: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 12,
    backgroundColor: BrandColors.gray200,
  },
  thumbFallback: { alignItems: "center", justifyContent: "center" },
  thumbFallbackText: { fontSize: 20 },
  textWrap: { flex: 1, gap: 2 },
  rowTitle: {
    fontSize: 15,
    fontFamily: "Fredoka-SemiBold",
    color: BrandColors.ink,
  },
  subtitle: {
    fontSize: 12,
    color: BrandColors.inkMuted,
  },
  moodBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: BrandColors.ink,
    backgroundColor: BrandColors.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  moodEmoji: { fontSize: 15 },
  empty: {
    color: BrandColors.inkMuted,
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
});
