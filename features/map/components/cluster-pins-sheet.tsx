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
  useRef,
  useState,
} from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StickerCard } from "@/components/ui/sticker-card";
import { BrandColors } from "@/constants/theme";
import { StickerBorderWidth, StickerRadius } from "@/constants/sticker-style";
import type { FriendMemoryPin, MemoryPin } from "@/types/api";

type ClusterPin = MemoryPin | FriendMemoryPin;

export type ClusterPinsSheetRef = {
  present: (pins: ClusterPin[]) => void;
  dismiss: () => void;
};

type ClusterPinsSheetProps = {
  onSelectPin: (pin: ClusterPin) => void;
};

/**
 * Picker shown when several pins sit at (or effectively at) the same spot
 * on the map — zooming in further would never visually separate them, so
 * this lets the user pick which one they meant instead of tapping forever.
 */
export const ClusterPinsSheet = forwardRef<ClusterPinsSheetRef, ClusterPinsSheetProps>(
  function ClusterPinsSheet({ onSelectPin }, ref) {
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<BottomSheetModal>(null);
    const [pins, setPins] = useState<ClusterPin[]>([]);

    useImperativeHandle(
      ref,
      () => ({
        present: (nextPins: ClusterPin[]) => {
          setPins(nextPins);
          sheetRef.current?.present();
        },
        dismiss: () => sheetRef.current?.dismiss(),
      }),
      [],
    );

    const onPressItem = useCallback(
      (pin: ClusterPin) => {
        sheetRef.current?.dismiss();
        onSelectPin(pin);
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

    return (
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={["40%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        topInset={insets.top}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Which memory?</Text>
        </View>
        <BottomSheetFlatList
          horizontal
          data={pins}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPressItem(item)}
              accessibilityRole="button"
              accessibilityLabel="Open memory"
            >
              <StickerCard
                style={styles.thumbFrame}
                radius={StickerRadius.card}
                borderWidth={StickerBorderWidth.standard}
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.thumbPhoto}
                  contentFit="cover"
                />
                {item.memoryCount > 1 ? (
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{item.memoryCount}</Text>
                  </View>
                ) : null}
              </StickerCard>
            </Pressable>
          )}
        />
      </BottomSheetModal>
    );
  },
);

const THUMB_SIZE = 96;

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
  title: { color: BrandColors.ink, fontSize: 18, fontFamily: "Fredoka-SemiBold" },
  list: { paddingHorizontal: 16, paddingVertical: 16, gap: 14 },
  thumbFrame: {
    alignSelf: "flex-start",
  },
  thumbPhoto: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: BrandColors.gray200,
  },
  countBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 5,
    backgroundColor: BrandColors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  countBadgeText: {
    color: BrandColors.paper,
    fontSize: 12,
    fontFamily: "Fredoka-SemiBold",
  },
});
