import Ionicons from "@expo/vector-icons/Ionicons";
import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlossyButton } from "@/components/ui/glossy-button";
import { StickerCard } from "@/components/ui/sticker-card";
import { StickerRadius } from "@/constants/sticker-style";
import { BrandColors } from "@/constants/theme";
import { showToast } from "@/features/toast/toast-store";
import { ApiClientError, getApiErrorMessage } from "@/lib/api/errors";
import { useCreateReportMutation } from "@/lib/query/hooks";
import type { ReportReason, ReportTargetType } from "@/types/api";

const NOTE_MAX_LENGTH = 500;

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "INAPPROPRIATE", label: "Inappropriate content" },
  { value: "SPAM", label: "Spam" },
  { value: "HARASSMENT", label: "Harassment or bullying" },
  { value: "PRIVACY", label: "Privacy violation" },
  { value: "OTHER", label: "Something else" },
];

export type ReportTarget = {
  type: ReportTargetType;
  id: string;
};

export type ReportSheetRef = {
  present: (target: ReportTarget) => void;
  dismiss: () => void;
};

/** Pick a reason (+ optional note) and POST /reports for a memory or user. */
export const ReportSheet = forwardRef<ReportSheetRef>(function ReportSheet(_props, ref) {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const createReport = useCreateReportMutation();
  const [target, setTarget] = useState<ReportTarget | null>(null);
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      present: (nextTarget) => {
        setTarget(nextTarget);
        setReason(null);
        setNote("");
        setError(null);
        sheetRef.current?.present();
      },
      dismiss: () => sheetRef.current?.dismiss(),
    }),
    [],
  );

  const submit = () => {
    if (!target || !reason) return;
    setError(null);
    const trimmedNote = note.trim();
    createReport.mutate(
      {
        targetType: target.type,
        targetId: target.id,
        reason,
        ...(trimmedNote ? { note: trimmedNote } : {}),
      },
      {
        onSuccess: () => {
          sheetRef.current?.dismiss();
          showToast("🙏 Thanks — we'll take a look.");
        },
        onError: (err) => {
          // The limiter answers 429 with code BAD_REQUEST, so check the status.
          if (err instanceof ApiClientError && err.status === 429) {
            setError("You've sent a lot of reports. Please try again later.");
            return;
          }
          setError(getApiErrorMessage(err, "Couldn't send your report."));
        },
      },
    );
  };

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

  const title = target?.type === "USER" ? "Report this user" : "Report this memory";

  return (
    <BottomSheetModal
      ref={sheetRef}
      enablePanDownToClose
      topInset={insets.top}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
    >
      <BottomSheetView
        style={[styles.content, { paddingBottom: Math.max(20, insets.bottom) }]}
      >
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sectionLabel}>Why are you reporting?</Text>

        <View style={styles.reasons}>
          {REASONS.map((item) => {
            const selected = item.value === reason;
            return (
              <Pressable
                key={item.value}
                onPress={() => setReason(item.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={item.label}
              >
                <StickerCard
                  radius={StickerRadius.button}
                  shadow={selected}
                  shadowOffset={2}
                  backgroundColor={selected ? BrandColors.primaryLight : BrandColors.paper}
                >
                  <View style={styles.reasonRow}>
                    <Ionicons
                      name={selected ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={BrandColors.ink}
                    />
                    <Text style={styles.reasonLabel}>{item.label}</Text>
                  </View>
                </StickerCard>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Add a note (optional)</Text>
        <StickerCard radius={StickerRadius.button} borderStyle="dashed" shadow={false}>
          <BottomSheetTextInput
            value={note}
            onChangeText={setNote}
            maxLength={NOTE_MAX_LENGTH}
            multiline
            placeholder="Anything that helps us understand"
            placeholderTextColor={BrandColors.inkMuted}
            style={styles.noteInput}
            accessibilityLabel="Report note"
          />
        </StickerCard>
        <Text style={styles.counter}>
          {note.length}/{NOTE_MAX_LENGTH}
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <GlossyButton
          label="Send report"
          onPress={submit}
          disabled={!reason}
          loading={createReport.isPending}
        />
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
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontFamily: "Fredoka-SemiBold",
    color: BrandColors.ink,
    paddingHorizontal: 6,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Fredoka-SemiBold",
    color: BrandColors.inkMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingHorizontal: 6,
    paddingTop: 4,
  },
  reasons: { gap: 8 },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  reasonLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Fredoka-SemiBold",
    color: BrandColors.ink,
  },
  noteInput: {
    minHeight: 72,
    maxHeight: 120,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: BrandColors.ink,
    textAlignVertical: "top",
  },
  counter: {
    alignSelf: "flex-end",
    fontSize: 12,
    color: BrandColors.inkMuted,
    paddingHorizontal: 6,
    marginTop: -4,
  },
  error: {
    fontSize: 14,
    fontFamily: "Fredoka-SemiBold",
    color: BrandColors.danger,
    paddingHorizontal: 6,
  },
});
