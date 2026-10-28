import Ionicons from "@expo/vector-icons/Ionicons";
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";

export type PhotoOptionsSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type PhotoOptionsSheetProps = {
  onSave: () => void;
};

/** Options for the draft photo on screen; for now, saving it to Photos. */
export const PhotoOptionsSheet = forwardRef<
  PhotoOptionsSheetRef,
  PhotoOptionsSheetProps
>(function PhotoOptionsSheet({ onSave }, ref) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(
    ref,
    () => ({
      present: () => sheetRef.current?.present(),
      dismiss: () => sheetRef.current?.dismiss(),
    }),
    [],
  );

  const save = useCallback(() => {
    sheetRef.current?.dismiss();
    onSave();
  }, [onSave]);

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
      enablePanDownToClose
      topInset={insets.top}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
    >
      <View
        style={[styles.content, { paddingBottom: Math.max(20, insets.bottom) }]}
      >
        <Pressable
          onPress={save}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel="Save photo to your photos"
        >
          <Ionicons name="download-outline" size={20} color={BrandColors.ink} />
          <Text style={styles.rowLabel}>Save to Photos</Text>
        </Pressable>
      </View>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  background: { backgroundColor: BrandColors.paper },
  handleIndicator: { backgroundColor: BrandColors.ink, width: 40 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 6,
    paddingVertical: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Baloo2-SemiBold",
    color: BrandColors.ink,
  },
});
