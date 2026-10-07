import Ionicons from "@expo/vector-icons/Ionicons";
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Alert, Pressable, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import type { MemoryMessage } from "@/types/api";

export type MessageActionsSheetRef = {
  present: (message: MemoryMessage) => void;
  dismiss: () => void;
};

type MessageActionsSheetProps = {
  onEdit: (message: MemoryMessage) => void;
  onDelete: (message: MemoryMessage) => void;
  onReport: (message: MemoryMessage) => void;
};

/**
 * Long-press menu for a thread message. Rows come straight from the API's
 * `canEdit` (you wrote it) and `canDelete` (you own the memory) flags:
 * authors may always delete their own message, so Delete shows for either.
 */
export const MessageActionsSheet = forwardRef<
  MessageActionsSheetRef,
  MessageActionsSheetProps
>(function MessageActionsSheet({ onEdit, onDelete, onReport }, ref) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [message, setMessage] = useState<MemoryMessage | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      present: (next) => {
        setMessage(next);
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }),
    [],
  );

  const run = useCallback(
    (action: (message: MemoryMessage) => void) => {
      sheetRef.current?.dismiss();
      if (message) action(message);
    },
    [message],
  );

  const confirmDelete = useCallback(() => {
    sheetRef.current?.dismiss();
    if (!message) return;
    Alert.alert("Delete this message?", "It'll be gone for everyone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete(message),
      },
    ]);
  }, [message, onDelete]);

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

  const canEdit = message?.canEdit ?? false;
  const canDelete = canEdit || (message?.canDelete ?? false);
  const canReport = message !== null && !canEdit;

  return (
    <BottomSheetModal
      ref={sheetRef}
      enablePanDownToClose
      topInset={insets.top}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
    >
      <BottomSheetView
        style={[styles.content, { paddingBottom: Math.max(20, insets.bottom) }]}
      >
        {canEdit ? (
          <Pressable
            onPress={() => run(onEdit)}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel="Edit message"
          >
            <Ionicons name="pencil-outline" size={20} color={BrandColors.ink} />
            <Text style={styles.rowLabel}>Edit</Text>
          </Pressable>
        ) : null}
        {canDelete ? (
          <Pressable
            onPress={confirmDelete}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel="Delete message"
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={BrandColors.danger}
            />
            <Text style={[styles.rowLabel, styles.dangerLabel]}>Delete</Text>
          </Pressable>
        ) : null}
        {canReport ? (
          <Pressable
            onPress={() => run(onReport)}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel="Report message"
          >
            <Ionicons
              name="flag-outline"
              size={20}
              color={BrandColors.danger}
            />
            <Text style={[styles.rowLabel, styles.dangerLabel]}>Report</Text>
          </Pressable>
        ) : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  background: { backgroundColor: BrandColors.paper },
  handleIndicator: { backgroundColor: BrandColors.ink, width: 40 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 2,
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
    fontFamily: "Fredoka-SemiBold",
    color: BrandColors.ink,
  },
  dangerLabel: {
    color: BrandColors.danger,
  },
});
