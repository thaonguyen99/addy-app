import { PlacePickerSection } from "@/features/camera/components/place-picker-section";
import { PhotoSelectionPlaceSearch } from "@/features/camera/components/photo-selection-place-search";
import { CameraUi } from "@/features/camera/constants/layout";
import { usePlaceSelectionScreen } from "@/features/camera/hooks/usePlaceSelectionScreen";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import {
  cameraLayout,
  sharedInteractionStyles,
} from "@/features/camera/styles/shared-styles";

export function PlaceSelectionScreen() {
  const insets = useSafeAreaInsets();
  const {
    venueName,
    setVenueName,
    coords,
    locationLoading,
    permissionDenied,
    refreshLocation,
    selectedPlace,
    selectPlace,
    searchResults,
    searchLoading,
    searchError,
    hasExplicitSelection,
    confirmAndContinue,
    goBack,
    canConfirm,
  } = usePlaceSelectionScreen();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={[styles.header, sharedInteractionStyles.hairlineBottomDark]}>
        <View style={styles.headerTopRow}>
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
              color={BrandColors.white}
            />
          </Pressable>
          <Text style={styles.screenTitle}>Where is this?</Text>
          <View style={styles.headerSpacer} />
        </View>
        <PhotoSelectionPlaceSearch
          value={venueName}
          onChangeText={setVenueName}
        />
      </View>

      <ScrollView
        style={sharedInteractionStyles.flexFill}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PlacePickerSection
          coords={coords}
          locationLoading={locationLoading}
          permissionDenied={permissionDenied}
          selectedPlace={selectedPlace}
          onSelectPlace={selectPlace}
          onRefreshLocation={refreshLocation}
          searchQuery={venueName}
          searchResults={searchResults}
          searchLoading={searchLoading}
          searchError={searchError}
          hasExplicitSelection={hasExplicitSelection}
        />
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
          <Text style={sharedInteractionStyles.primaryCtaText}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: CameraUi.screenBg,
  },
  header: {
    paddingHorizontal: cameraLayout.screenPaddingHorizontal,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: CameraUi.screenBg,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  screenTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: BrandColors.white,
    textAlign: "center",
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
    paddingTop: 8,
  },
  footer: {
    paddingHorizontal: cameraLayout.screenPaddingHorizontal,
    paddingTop: 12,
    backgroundColor: CameraUi.screenBg,
  },
  confirmBtnDisabled: {
    backgroundColor: BrandColors.gray700,
  },
});
