import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UserAvatar, userDisplayName } from "@/components/ui/user-row";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
} from "@/constants/theme";
import {
  ReportSheet,
  type ReportSheetRef,
} from "@/features/reports/components/report-sheet";
import { getApiErrorMessage } from "@/services/api/errors";
import { useUnfriendMutation } from "@/services/friends";
import { useBlockUserMutation } from "@/services/social";
import {
  type FriendMenuTarget,
  useFriendSheetsStore,
} from "@/stores/friend-sheets.store";
import { showToast } from "@/stores/toast.store";

/** "friends since Sep 2026" */
function friendsSinceLabel(iso: string | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const monthYear = date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
  return `friends since ${monthYear}`;
}

/**
 * Long-press a friend (or ⋯ on their map): See map, Remove (with a confirm
 * step in the same sheet), Report, Block.
 */
export function FriendMenuSheet() {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const reportSheet = useRef<ReportSheetRef>(null);
  const target = useFriendSheetsStore((s) => s.menu);
  const closeFriendMenu = useFriendSheetsStore((s) => s.closeFriendMenu);
  const [shown, setShown] = useState<FriendMenuTarget | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const unfriend = useUnfriendMutation();
  const block = useBlockUserMutation();

  useEffect(() => {
    if (!target) return;
    setShown(target);
    setConfirmingRemove(false);
    sheetRef.current?.present();
  }, [target]);

  const close = useCallback(() => sheetRef.current?.dismiss(), []);

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

  // The modal must always be mounted so `present()` has a ref to call.
  const user = shown?.user;
  const name = user ? userDisplayName(user) : "";
  const since = friendsSinceLabel(shown?.friendsSince);

  const seeMap = () => {
    if (!user) return;
    close();
    router.navigate({
      pathname: "/(app)/(tabs)/explore",
      params: { friend: user.id },
    });
  };

  const remove = () =>
    user &&
    unfriend.mutate(user.id, {
      onSuccess: () => {
        close();
        showToast(`Removed ${name}`);
      },
      onError: (error) =>
        showToast(
          getApiErrorMessage(error, "Couldn't remove them. Try again."),
        ),
    });

  const report = () => {
    if (!user) return;
    close();
    reportSheet.current?.present({ type: "USER", id: user.id });
  };

  const confirmBlock = () =>
    user &&
    Alert.alert(
      `Block ${name}?`,
      "They won't be able to send you requests or see your memories. Any friendship is removed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () =>
            block.mutate(user.id, {
              onSuccess: () => {
                close();
                showToast(`Blocked ${name}`);
              },
              onError: (error) =>
                showToast(getApiErrorMessage(error, "Couldn't block them.")),
            }),
        },
      ],
    );

  return (
    <>
      <BottomSheetModal
        ref={sheetRef}
        enablePanDownToClose
        topInset={insets.top}
        onDismiss={closeFriendMenu}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
      >
        <BottomSheetView
          style={[styles.content, { paddingBottom: insets.bottom }]}
        >
          {!user ? null : confirmingRemove ? (
            <View style={styles.confirm}>
              <Text style={styles.confirmTitle}>Remove {name}?</Text>
              <Text style={styles.confirmBody}>
                You&apos;ll stop seeing each other&apos;s friends-only memories.{" "}
                {name} won&apos;t be told. You can add each other again later.
              </Text>
              <View style={styles.confirmButtons}>
                <Pressable
                  onPress={() => setConfirmingRemove(false)}
                  disabled={unfriend.isPending}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.confirmButton,
                    styles.keep,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.keepText}>Keep</Text>
                </Pressable>
                <Pressable
                  onPress={remove}
                  disabled={unfriend.isPending}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${name}`}
                  accessibilityState={{ busy: unfriend.isPending }}
                  style={({ pressed }) => [
                    styles.confirmButton,
                    styles.removeButton,
                    (pressed || unfriend.isPending) && styles.pressed,
                  ]}
                >
                  <Text style={styles.removeText}>
                    {unfriend.isPending ? "Removing…" : "Remove"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <UserAvatar user={user} size={48} />
                <View style={styles.headerText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {name}
                  </Text>
                  {since ? <Text style={styles.since}>{since}</Text> : null}
                </View>
              </View>
              <MenuRow
                glyph="🗺️"
                label={`See ${name}'s map`}
                onPress={seeMap}
              />
              <MenuRow
                glyph="👋"
                label="Remove friend"
                onPress={() => setConfirmingRemove(true)}
              />
              <MenuRow glyph="⚑" label="Report" onPress={report} />
              <MenuRow
                glyph="⛔"
                label="Block"
                danger
                last
                onPress={confirmBlock}
              />
            </>
          )}
        </BottomSheetView>
      </BottomSheetModal>
      <ReportSheet ref={reportSheet} />
    </>
  );
}

function MenuRow({
  glyph,
  label,
  danger = false,
  last = false,
  onPress,
}: {
  glyph: string;
  label: string;
  danger?: boolean;
  last?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        !last && styles.rowDivider,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.rowGlyph}>{glyph}</Text>
      <Text style={[styles.rowLabel, danger && styles.danger]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: AddyColors.paper },
  handleIndicator: { backgroundColor: AddyColors.line, width: 40 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    marginBottom: 6,
    borderRadius: AddyRadius.card,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  headerText: { flex: 1, gap: 2 },
  name: {
    fontFamily: AddyFonts.title,
    fontSize: 18,
    lineHeight: 24,
    color: AddyColors.ink,
  },
  since: {
    fontFamily: AddyFonts.tech,
    fontSize: 17,
    color: AddyColors.inkMuted,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    minHeight: 56,
    paddingHorizontal: 12,
  },
  rowDivider: {
    borderBottomWidth: ADDY_BORDER_WIDTH,
    borderBottomColor: AddyColors.line,
  },
  rowGlyph: { width: 28, fontSize: 20, textAlign: "center" },
  rowLabel: { fontFamily: AddyFonts.body, fontSize: 17, color: AddyColors.ink },
  danger: { color: AddyColors.pink },
  confirm: { alignItems: "center", gap: 12, paddingTop: 8 },
  confirmTitle: {
    fontFamily: AddyFonts.title,
    fontSize: 24,
    lineHeight: 32,
    color: AddyColors.ink,
    textAlign: "center",
  },
  confirmBody: {
    fontFamily: AddyFonts.body,
    fontSize: 16,
    lineHeight: 23,
    color: AddyColors.inkMuted,
    textAlign: "center",
  },
  confirmButtons: {
    flexDirection: "row",
    alignSelf: "stretch",
    gap: 12,
    marginTop: 8,
  },
  confirmButton: {
    flex: 1,
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: AddyRadius.pill,
    borderWidth: ADDY_BORDER_WIDTH,
  },
  keep: { backgroundColor: AddyColors.white, borderColor: AddyColors.line },
  keepText: {
    fontFamily: AddyFonts.title,
    fontSize: 17,
    color: AddyColors.ink,
  },
  removeButton: { backgroundColor: AddyColors.pink, borderColor: "#E8459A" },
  removeText: {
    fontFamily: AddyFonts.title,
    fontSize: 17,
    color: AddyColors.white,
  },
  pressed: { opacity: 0.75 },
});
