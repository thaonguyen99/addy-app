import {
  BottomSheetBackdrop,
  BottomSheetModal,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import { MemoryFeedList } from "@/features/feed/components/memory-feed-list";

export type MemoryFeedSheetHandle = {
  present: () => void;
  dismiss: () => void;
};

const SNAP_POINTS = ["65%", "92%"];

export const MemoryFeedSheet = forwardRef<MemoryFeedSheetHandle>(
  function MemoryFeedSheet(_props, ref) {
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<BottomSheetModal>(null);
    const [index, setIndex] = useState(-1);

    useImperativeHandle(
      ref,
      () => ({
        present: () => sheetRef.current?.present(),
        dismiss: () => sheetRef.current?.dismiss(),
      }),
      [],
    );

    const dismiss = useCallback(() => sheetRef.current?.dismiss(), []);

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
        snapPoints={SNAP_POINTS}
        enableDynamicSizing={false}
        enablePanDownToClose
        onChange={setIndex}
        topInset={insets.top}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Your memories</Text>
        </View>
        <MemoryFeedList active={index >= 0} onDismiss={dismiss} />
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  background: {
    backgroundColor: BrandColors.gray900,
  },
  handleIndicator: {
    backgroundColor: BrandColors.neutralBorder,
    width: 40,
  },
  titleRow: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BrandColors.stroke2,
  },
  title: {
    color: BrandColors.neutral,
    fontSize: 18,
    fontWeight: "700",
  },
});
