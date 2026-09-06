import { MoodScorePicker } from "@/features/camera/components/mood-score-picker";
import { PhotoSelectionPreviewCarousel } from "@/features/camera/components/PhotoSelectionPreviewCarousel";
import { PhotoSelectionGalleryButton } from "@/features/camera/components/photo-selection-header";
import { CameraUi } from "@/features/camera/constants/layout";
import { usePhotoSelectionScreen } from "@/features/camera/hooks/usePhotoSelectionScreen";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import {
  cameraLayout,
  sharedInteractionStyles,
} from "@/features/camera/styles/shared-styles";

function PhotoSelectionEmptyHint() {
  return (
    <View style={emptyStyles.wrap}>
      <MaterialIcons
        name="add-photo-alternate"
        size={40}
        color={BrandColors.neutralMuted}
      />
      <Text style={emptyStyles.title}>No photos yet</Text>
      <Text style={emptyStyles.sub}>
        Add shots from your session or choose from your gallery.
      </Text>
    </View>
  );
}

export function PhotoSelectionScreen() {
  const insets = useSafeAreaInsets();
  const {
    allPhotos,
    selectedIds,
    selectionKey,
    toggleSelection,
    selectedPhotos,
    picking,
    pickFromGalleryWithFeedback,
    confirmAndContinue,
    goBack,
    moodScore,
    setMoodScore,
    feeling,
    setFeeling,
    canConfirm,
  } = usePhotoSelectionScreen();

  const selectedCount = selectedPhotos.length;
  const hasPhotos = allPhotos.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.topBar, sharedInteractionStyles.hairlineBottomDark]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={cameraLayout.hitSlop}
          onPress={goBack}
          style={({ pressed }) => [
            styles.backBtn,
            pressed && sharedInteractionStyles.pressedStrong,
          ]}
        >
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={BrandColors.neutral}
          />
        </Pressable>
        <Text style={styles.screenTitle}>Add to pin</Text>
        <PhotoSelectionGalleryButton
          picking={picking}
          onPickFromGallery={pickFromGalleryWithFeedback}
        />
      </View>

      <ScrollView
        style={sharedInteractionStyles.flexFill}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {hasPhotos ? (
          <>
            <PhotoSelectionPreviewCarousel
              photos={allPhotos}
              selectedIds={selectedIds}
              selectionKey={selectionKey}
              onToggle={toggleSelection}
            />
            <MoodScorePicker value={moodScore} onChange={setMoodScore} />
            <View style={styles.feelingBlock}>
              <Text style={styles.feelingLabel}>What&apos;s on your mind?</Text>
              <Text style={styles.feelingHint}>Optional</Text>
              <TextInput
                value={feeling}
                onChangeText={setFeeling}
                placeholder="A note about this moment…"
                placeholderTextColor={BrandColors.neutralMuted}
                multiline
                maxLength={500}
                style={styles.feelingInput}
                textAlignVertical="top"
              />
            </View>
          </>
        ) : (
          <PhotoSelectionEmptyHint />
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          sharedInteractionStyles.hairlineTopDark,
          { paddingBottom: Math.max(20, insets.bottom) },
        ]}
      >
        <Pressable
          onPress={confirmAndContinue}
          disabled={!canConfirm}
          style={({ pressed }) => [
            sharedInteractionStyles.primaryCta,
            !canConfirm && styles.confirmBtnDisabled,
            pressed && canConfirm && sharedInteractionStyles.pressedSubtle,
          ]}
        >
          <Text style={sharedInteractionStyles.primaryCtaText}>
            Continue{selectedCount > 0 ? ` (${selectedCount})` : ""}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const emptyStyles = StyleSheet.create({
  wrap: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    color: BrandColors.neutral,
    textAlign: "center",
  },
  sub: {
    fontSize: 14,
    color: BrandColors.neutralMuted,
    textAlign: "center",
    lineHeight: 20,
  },
});

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: CameraUi.screenBg,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: cameraLayout.screenPaddingHorizontal,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 8,
    backgroundColor: CameraUi.screenBg,
  },
  screenTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: BrandColors.neutral,
    textAlign: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
    paddingTop: 8,
  },
  feelingBlock: {
    paddingHorizontal: cameraLayout.screenPaddingHorizontal,
    paddingTop: 20,
    gap: 6,
  },
  feelingLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: BrandColors.neutral,
  },
  feelingHint: {
    fontSize: 13,
    color: BrandColors.neutralMuted,
    marginBottom: 4,
  },
  feelingInput: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: BrandColors.neutralBorder,
    borderRadius: cameraLayout.cornerRadiusMd,
    backgroundColor: BrandColors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: BrandColors.neutral,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: cameraLayout.screenPaddingHorizontal,
    paddingTop: 12,
    backgroundColor: CameraUi.screenBg,
  },
  confirmBtnDisabled: {
    backgroundColor: BrandColors.neutralBorder,
  },
});
