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

import { BrandColors } from "@/constants/theme";
import { POLAROID } from "@/features/feed/utils/polaroid";
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
                style={styles.thumbFrame}
                onPress={() => openMemory(item.id)}
                accessibilityRole="button"
                accessibilityLabel="Open memory"
              >
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.thumbPhoto}
                  contentFit="cover"
                />
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
  background: { backgroundColor: BrandColors.gray900 },
  handleIndicator: { backgroundColor: BrandColors.neutralBorder, width: 40 },
  titleRow: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BrandColors.stroke2,
  },
  title: { color: BrandColors.neutral, fontSize: 18, fontWeight: "700" },
  center: { padding: 40, alignItems: "center" },
  list: { paddingHorizontal: 16, paddingVertical: 16, gap: 14 },
  thumbFrame: {
    backgroundColor: POLAROID.frameColor,
    borderRadius: POLAROID.radius,
    paddingTop: POLAROID.borderTop,
    paddingLeft: POLAROID.borderSide,
    paddingRight: POLAROID.borderSide,
    paddingBottom: POLAROID.borderBottom,
    ...POLAROID.shadow,
  },
  thumbPhoto: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: 1,
    backgroundColor: BrandColors.gray200,
  },
  empty: {
    color: BrandColors.neutralMuted,
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
});
