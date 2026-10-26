import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
} from "@/constants/theme";

const ROW_HEIGHT = 52;

/** Every half hour of the day, "00:00" … "23:30". */
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  return `${h}:${i % 2 === 0 ? "00" : "30"}`;
});

/** "09:00" → "9:00" for display. */
export function displayTime(time: string): string {
  return time.replace(/^0(\d)/, "$1");
}

export type OnThisDayTimeSheetRef = { present: () => void };

/** Pick the local time for the daily On this day push. */
export const OnThisDayTimeSheet = forwardRef<
  OnThisDayTimeSheetRef,
  { value: string; onChange: (time: string) => void }
>(function OnThisDayTimeSheet({ value, onChange }, ref) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);

  useImperativeHandle(ref, () => ({
    present: () => sheetRef.current?.present(),
  }));

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

  // A custom time (set elsewhere) still scrolls near its half hour.
  const selectedIndex = Math.max(
    0,
    TIMES.findIndex((time) => time >= value),
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["55%"]}
      enableDynamicSizing={false}
      enablePanDownToClose
      topInset={insets.top}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>On this day at</Text>
        <Text style={styles.note}>your local time</Text>
      </View>
      <BottomSheetFlatList
        data={TIMES}
        keyExtractor={(time: string) => time}
        initialScrollIndex={Math.max(0, selectedIndex - 2)}
        getItemLayout={(_: unknown, index: number) => ({
          length: ROW_HEIGHT,
          offset: ROW_HEIGHT * index,
          index,
        })}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 16 },
        ]}
        renderItem={({ item }: { item: string }) => {
          const selected = item === value;
          return (
            <Pressable
              onPress={() => {
                onChange(item);
                sheetRef.current?.dismiss();
              }}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.row,
                selected && styles.rowSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.time, selected && styles.timeSelected]}>
                {displayTime(item)}
              </Text>
              {selected ? <Text style={styles.check}>✓</Text> : null}
            </Pressable>
          );
        }}
      />
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  background: { backgroundColor: AddyColors.paper },
  handleIndicator: { backgroundColor: AddyColors.line, width: 40 },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  title: {
    fontFamily: AddyFonts.title,
    fontSize: 20,
    lineHeight: 28,
    color: AddyColors.ink,
  },
  note: { fontFamily: AddyFonts.tech, fontSize: 16, color: AddyColors.inkMuted },
  list: { paddingHorizontal: 16 },
  row: {
    height: ROW_HEIGHT - 6,
    marginBottom: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderRadius: AddyRadius.input,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: "transparent",
  },
  rowSelected: {
    backgroundColor: AddyColors.limePale,
    borderColor: AddyColors.limeDeep,
  },
  pressed: { opacity: 0.7 },
  time: { fontFamily: AddyFonts.tech, fontSize: 24, color: AddyColors.ink },
  timeSelected: { color: AddyColors.ink },
  check: { fontFamily: AddyFonts.title, fontSize: 18, color: AddyColors.ink },
});
