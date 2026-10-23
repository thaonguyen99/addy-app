import Ionicons from "@expo/vector-icons/Ionicons";
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import type { MemoryVisibility } from "@/types/api";
import { Switch } from "react-native-gesture-handler";

const VISIBILITY_DEBOUNCE_MS = 500;

export type MemoryOptionsSheetRef = {
  present: () => void;
  dismiss: () => void;
};

type MemoryOptionsSheetProps = {
  isOwner: boolean;
  visibility: MemoryVisibility;
  onChangeVisibility: (visibility: MemoryVisibility) => void;
  onEdit: () => void;
  onDelete: () => void;
  onReport: () => void;
  /** Shown to a tagged viewer: removes their tag (and access, if private). */
  onUntagSelf?: () => void;
};

export const MemoryOptionsSheet = forwardRef<
  MemoryOptionsSheetRef,
  MemoryOptionsSheetProps
>(function MemoryOptionsSheet(
  {
    isOwner,
    visibility,
    onChangeVisibility,
    onEdit,
    onDelete,
    onReport,
    onUntagSelf,
  },
  ref,
) {
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

  // Local, optimistic switch position — flips instantly on every tap, even
  // while a rapid run of taps is still debouncing, rather than snapping
  // back and forth as it waits on `visibility` to catch up from the server.
  const [isFriends, setIsFriends] = useState(visibility === "friends");
  useEffect(() => {
    setIsFriends(visibility === "friends");
  }, [visibility]);

  const pendingChangeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (pendingChangeRef.current) clearTimeout(pendingChangeRef.current);
    },
    [],
  );

  const toggleVisibility = useCallback(
    (nextIsFriends: boolean) => {
      setIsFriends(nextIsFriends);
      if (pendingChangeRef.current) clearTimeout(pendingChangeRef.current);
      pendingChangeRef.current = setTimeout(() => {
        pendingChangeRef.current = null;
        onChangeVisibility(nextIsFriends ? "friends" : "private");
      }, VISIBILITY_DEBOUNCE_MS);
    },
    [onChangeVisibility],
  );

  const editMemory = useCallback(() => {
    sheetRef.current?.dismiss();
    onEdit();
  }, [onEdit]);

  const confirmDelete = useCallback(() => {
    sheetRef.current?.dismiss();
    Alert.alert(
      "Delete this memory?",
      "This photo, its caption, and reactions will be gone for good.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ],
    );
  }, [onDelete]);

  const confirmUntag = useCallback(() => {
    if (!onUntagSelf) return;
    sheetRef.current?.dismiss();
    Alert.alert(
      "Remove yourself?",
      visibility === "private"
        ? "You won't be able to see this memory or its chat anymore."
        : "You'll no longer be tagged on this memory.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: onUntagSelf },
      ],
    );
  }, [onUntagSelf, visibility]);

  const openReport = useCallback(() => {
    sheetRef.current?.dismiss();
    onReport();
  }, [onReport]);

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
      snapPoints={[isOwner ? "38%" : onUntagSelf ? "30%" : "22%"]}
      enableDynamicSizing={false}
      enablePanDownToClose
      topInset={insets.top}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
    >
      <View
        style={[styles.content, { paddingBottom: Math.max(20, insets.bottom) }]}
      >
        {isOwner ? (
          <>
            <Text style={styles.sectionLabel}>Visibility</Text>
            <View style={styles.row}>
              <Ionicons
                name={isFriends ? "people-outline" : "lock-closed-outline"}
                size={20}
                color={BrandColors.ink}
              />
              <Text style={styles.rowLabel}>Visible to friends</Text>
              <Switch
                value={isFriends}
                onValueChange={toggleVisibility}
                trackColor={{ true: BrandColors.primary }}
                accessibilityLabel="Visible to friends"
              />
            </View>

            <View style={styles.divider} />
            <Pressable
              onPress={editMemory}
              style={styles.row}
              accessibilityRole="button"
              accessibilityLabel="Edit memory"
            >
              <Ionicons
                name="pencil-outline"
                size={20}
                color={BrandColors.ink}
              />
              <Text style={[styles.rowLabel]}>Edit memory</Text>
            </Pressable>

            <Pressable
              onPress={confirmDelete}
              style={styles.row}
              accessibilityRole="button"
              accessibilityLabel="Delete memory"
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={BrandColors.danger}
              />
              <Text style={[styles.rowLabel, styles.dangerLabel]}>
                Delete memory
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            {onUntagSelf ? (
              <Pressable
                onPress={confirmUntag}
                style={styles.row}
                accessibilityRole="button"
                accessibilityLabel="Remove me from this memory"
              >
                <Ionicons
                  name="person-remove-outline"
                  size={20}
                  color={BrandColors.ink}
                />
                <Text style={styles.rowLabel}>Remove me from this memory</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={openReport}
              style={styles.row}
              accessibilityRole="button"
              accessibilityLabel="Report memory"
            >
              <Ionicons
                name="flag-outline"
                size={20}
                color={BrandColors.danger}
              />
              <Text style={[styles.rowLabel, styles.dangerLabel]}>
                Report memory
              </Text>
            </Pressable>
          </>
        )}
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
    gap: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Baloo2-SemiBold",
    color: BrandColors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingHorizontal: 6,
    paddingBottom: 6,
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
  dangerLabel: {
    color: BrandColors.danger,
  },
  grayLabel: {
    color: BrandColors.gray100,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BrandColors.stroke2,
    marginVertical: 8,
  },
});
