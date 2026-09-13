import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StickerCard } from "@/components/ui/sticker-card";
import { BrandColors } from "@/constants/theme";
import { StickerBorderWidth, StickerRadius } from "@/constants/sticker-style";
import { usePlaceMemoriesQuery } from "@/lib/query/hooks";
import type { PlaceMemory } from "@/types/api";

export type PlaceMemoriesSheetRef = {
  present: (placeId: string) => void;
  dismiss: () => void;
};

export const PlaceMemoriesSheet = forwardRef<PlaceMemoriesSheetRef>(
  function PlaceMemoriesSheet(_props, ref) {
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<BottomSheetModal>(null);
    const [placeId, setPlaceId] = useState<string | null>(null);
    const [active, setActive] = useState(false);

    useImperativeHandle(
      ref,
      () => ({
        present: (id: string) => {
          setPlaceId(id);
          sheetRef.current?.present();
        },
        dismiss: () => sheetRef.current?.dismiss(),
      }),
      [],
    );

    const query = usePlaceMemoriesQuery(active ? placeId : null);
    const memories = query.data ?? [];

    const openMemory = useCallback((id: string) => {
      sheetRef.current?.dismiss();
      router.push(`/memory/${id}`);
    }, []);

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
        onChange={(index) => setActive(index >= 0)}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Memories here</Text>
        </View>
        {query.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={BrandColors.primary} />
          </View>
        ) : (
          <BottomSheetFlatList
            horizontal
            data={memories}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }: { item: PlaceMemory }) => (
              <Pressable
                onPress={() => openMemory(item.id)}
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
                </StickerCard>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.empty}>No memories to show.</Text>
            }
          />
        )}
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
  center: { padding: 40, alignItems: "center" },
  list: { paddingHorizontal: 16, paddingVertical: 16, gap: 14 },
  thumbFrame: {
    alignSelf: "flex-start",
  },
  thumbPhoto: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    backgroundColor: BrandColors.gray200,
  },
  empty: {
    color: BrandColors.neutralMuted,
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
});
