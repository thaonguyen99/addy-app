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
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TechChip } from "@/components/ui/tech-chip";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
} from "@/constants/theme";
import { formatRelativeTime } from "@/features/feed/utils/format-relative-time";
import { cloudinaryThumb } from "@/lib/image/cloudinary-thumb";
import { useClusterMemoriesQuery } from "@/lib/query/hooks";
import type { FriendMemoryPin, MemoryPin } from "@/types/api";

type ClusterPin = MemoryPin | FriendMemoryPin;

const COLUMNS = 3;
const GAP = 8;
const SIDE = 16;

export type ClusterPinsSheetRef = {
  present: (pins: ClusterPin[]) => void;
  dismiss: () => void;
};

type ClusterPinsSheetProps = {
  onSelectMemory: (memoryId: string) => void;
};

/**
 * Picker shown when a grouped pin is tapped: every memory inside it in one
 * flat grid (places with several memories are expanded), newest first.
 * Tapping a tile opens that memory.
 */
export const ClusterPinsSheet = forwardRef<ClusterPinsSheetRef, ClusterPinsSheetProps>(
  function ClusterPinsSheet({ onSelectMemory }, ref) {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const sheetRef = useRef<BottomSheetModal>(null);
    const [pins, setPins] = useState<ClusterPin[]>([]);
    const { memories, isLoading } = useClusterMemoriesQuery(pins);
    const tile = Math.floor((width - SIDE * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

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
      (id: string) => {
        sheetRef.current?.dismiss();
        onSelectMemory(id);
      },
      [onSelectMemory],
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
        snapPoints={["50%", "85%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        topInset={insets.top}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
        onDismiss={() => setPins([])}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Which memory?</Text>
          {memories.length > 0 ? (
            <TechChip label={`${memories.length} here`} size="sm" />
          ) : null}
        </View>
        <BottomSheetFlatList
          data={memories}
          keyExtractor={(item) => item.id}
          numColumns={COLUMNS}
          columnWrapperStyle={styles.column}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Math.max(24, insets.bottom + 12) },
          ]}
          ListFooterComponent={
            isLoading ? <ActivityIndicator color={AddyColors.ink} style={styles.loading} /> : null
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPressItem(item.id)}
              accessibilityRole="button"
              accessibilityLabel={`Open memory from ${formatRelativeTime(item.capturedAt)}`}
              style={({ pressed }) => [
                styles.tile,
                { width: tile, height: tile },
                pressed && styles.pressed,
              ]}
            >
              <Image
                source={{ uri: cloudinaryThumb(item.imageUrl, tile) }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                recyclingKey={item.id}
              />
              <TechChip
                label={formatRelativeTime(item.capturedAt)}
                tone="dark"
                size="sm"
                style={styles.time}
              />
            </Pressable>
          )}
        />
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  background: { backgroundColor: AddyColors.paper },
  handleIndicator: { backgroundColor: AddyColors.line, width: 40 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIDE,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: ADDY_BORDER_WIDTH,
    borderBottomColor: AddyColors.line,
  },
  title: {
    fontFamily: AddyFonts.title,
    fontSize: 19,
    lineHeight: 28,
    color: AddyColors.ink,
  },
  list: { paddingHorizontal: SIDE, paddingTop: 14 },
  column: { gap: GAP, marginBottom: GAP },
  tile: {
    borderRadius: AddyRadius.tile + 4,
    overflow: "hidden",
    backgroundColor: AddyColors.paperDim,
  },
  time: { position: "absolute", left: 6, bottom: 6 },
  pressed: { opacity: 0.8 },
  loading: { paddingVertical: 16 },
});
