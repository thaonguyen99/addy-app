import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import { PhotoSelectionPlaceSearch } from "@/features/camera/components/photo-selection-place-search";
import { PlacePickerSection } from "@/features/camera/components/place-picker-section";
import {
  cameraLayout,
  sharedInteractionStyles,
} from "@/features/camera/styles/shared-styles";
import { useEditMemoryStore } from "@/features/edit-memory/store/edit-memory-store";
import { useCurrentLocation } from "@/features/location/hooks/use-current-location";
import { useDebouncedPlaceSearch } from "@/features/location/hooks/use-debounced-place-search";
import { safeBack } from "@/lib/navigation/safe-router";
import type { PlaceSuggestion } from "@/types/api";

/** Pick a new place for the memory being edited; writes it to the edit draft. */
export function EditMemoryPlaceScreen() {
  const insets = useSafeAreaInsets();
  const currentPlace = useEditMemoryStore((s) => s.place);
  const memoryId = useEditMemoryStore((s) => s.memoryId);
  const setPlace = useEditMemoryStore((s) => s.setPlace);

  const { coords, loading, permissionDenied, refresh } = useCurrentLocation();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<PlaceSuggestion | null>(null);
  const search = useDebouncedPlaceSearch(query, coords);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Opened without an edit in progress (e.g. a stale deep link).
  useEffect(() => {
    if (!memoryId) safeBack("/");
  }, [memoryId]);

  const confirm = () => {
    if (!picked) return;
    setPlace(picked);
    safeBack("/");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={cameraLayout.hitSlop}
            onPress={() => safeBack("/")}
            style={({ pressed }) => [
              styles.backBtn,
              pressed && sharedInteractionStyles.pressedStrong,
            ]}
          >
            <MaterialIcons name="arrow-back" size={24} color={BrandColors.neutral} />
          </Pressable>
          <Text style={styles.screenTitle}>Where is this?</Text>
          <View style={styles.headerSpacer} />
        </View>
        <PhotoSelectionPlaceSearch value={query} onChangeText={setQuery} />
      </View>

      <ScrollView
        style={sharedInteractionStyles.flexFill}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PlacePickerSection
          coords={coords}
          locationLoading={loading}
          permissionDenied={permissionDenied}
          selectedPlace={picked ?? currentPlace}
          onSelectPlace={setPicked}
          onRefreshLocation={() => void refresh()}
          searchQuery={query}
          searchResults={search.results}
          searchLoading={search.loading}
          searchError={search.error}
          hasExplicitSelection={picked !== null}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(20, insets.bottom) }]}>
        <Pressable
          onPress={confirm}
          disabled={!picked}
          style={({ pressed }) => [
            sharedInteractionStyles.primaryCta,
            styles.confirmBtn,
            !picked && styles.confirmBtnDisabled,
            pressed && picked && sharedInteractionStyles.pressedSubtle,
          ]}
        >
          <Text style={[sharedInteractionStyles.primaryCtaText, styles.confirmBtnText]}>
            Use this place
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.paper },
  header: {
    paddingHorizontal: cameraLayout.screenPaddingHorizontal,
    paddingTop: 4,
    paddingBottom: 12,
    gap: 12,
    backgroundColor: BrandColors.paper,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BrandColors.stroke2,
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
  headerSpacer: { width: 40 },
  scrollContent: { flexGrow: 1, paddingBottom: 24, paddingTop: 8 },
  footer: {
    paddingHorizontal: cameraLayout.screenPaddingHorizontal,
    paddingTop: 12,
    backgroundColor: BrandColors.paper,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BrandColors.stroke2,
  },
  confirmBtn: { backgroundColor: BrandColors.primary },
  confirmBtnText: { color: BrandColors.ink },
  confirmBtnDisabled: { backgroundColor: BrandColors.gray200 },
});
