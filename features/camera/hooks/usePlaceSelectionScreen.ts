import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";

import { continueToCreatePinFlow } from "@/features/create-pin/continue-to-create-pin";
import { useCreatePinHandoffStore } from "@/features/create-pin/store/create-pin-handoff-store";
import { createHoChiMinhCityPlace } from "@/features/location/fallback-places";
import { useCurrentLocation } from "@/features/location/hooks/use-current-location";
import { useDebouncedPlaceSearch } from "@/features/location/hooks/use-debounced-place-search";
import { useReverseGeocodedPlace } from "@/features/location/hooks/use-reverse-geocoded-place";
import { safeBack } from "@/lib/navigation/safe-router";
import type { PlaceSuggestion } from "@/types/api";

const VENUE_NAME_DEBOUNCE_MS = 300;
const MIN_SEARCH_LENGTH = 2;

function isManualPlace(place: PlaceSuggestion): boolean {
  return place.placeId.startsWith("manual:");
}

export function usePlaceSelectionScreen() {
  const draftImages = useCreatePinHandoffStore((s) => s.images);
  const moodScore = useCreatePinHandoffStore((s) => s.moodScore);
  const feeling = useCreatePinHandoffStore((s) => s.feeling);

  const {
    coords,
    loading: locationLoading,
    permissionDenied,
    refresh: refreshLocation,
  } = useCurrentLocation();

  const [venueName, setVenueNameState] = useState("");
  const [debouncedVenueName, setDebouncedVenueName] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion>(() =>
    createHoChiMinhCityPlace(),
  );
  const [hasExplicitSelection, setHasExplicitSelection] = useState(false);
  const isFocused = useIsFocused();

  const apiSelectedPlaceRef = useRef<PlaceSuggestion | null>(null);

  const isSearchActive = venueName.trim().length >= MIN_SEARCH_LENGTH;

  // Street-level place for wherever the user physically is — the default pick.
  const { place: currentLocationPlace, loading: currentLocationLoading } =
    useReverseGeocodedPlace(coords);

  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
  } = useDebouncedPlaceSearch(venueName, coords);

  const setVenueName = useCallback((text: string) => {
    setVenueNameState(text);
    if (text.trim().length >= MIN_SEARCH_LENGTH) {
      apiSelectedPlaceRef.current = null;
      setHasExplicitSelection(false);
    }
  }, []);

  useEffect(() => {
    void refreshLocation();
  }, [refreshLocation]);

  useEffect(() => {
    // Only bounce back when the user is actually looking at this screen with no
    // draft (e.g. a deep link). Skip while blurred — after a successful save the
    // handoff store is cleared as the whole flow is being dismissed.
    if (isFocused && draftImages.length === 0) {
      router.replace("/photo-selection");
    }
  }, [draftImages.length, isFocused]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedVenueName(venueName);
    }, VENUE_NAME_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [venueName]);

  // While not searching and nothing explicitly picked, keep the selected place
  // in sync with the current-location result (falling back to the city). Typing
  // a venue name relabels that place without changing its address/coords.
  useEffect(() => {
    if (isSearchActive) return;
    if (apiSelectedPlaceRef.current) return;

    const name = debouncedVenueName.trim();
    const base =
      currentLocationPlace ??
      createHoChiMinhCityPlace({ name: debouncedVenueName });

    setSelectedPlace(name ? { ...base, name } : base);
    setHasExplicitSelection(false);
  }, [debouncedVenueName, isSearchActive, currentLocationPlace]);

  const selectPlace = useCallback((place: PlaceSuggestion) => {
    setHasExplicitSelection(true);
    apiSelectedPlaceRef.current = isManualPlace(place) ? null : place;
    setSelectedPlace(place);
  }, []);

  const refreshLocationAndUseGps = useCallback(() => {
    apiSelectedPlaceRef.current = null;
    setHasExplicitSelection(false);
    setVenueNameState("");
    void refreshLocation();
  }, [refreshLocation]);

  const confirmAndContinue = useCallback(() => {
    if (draftImages.length === 0) return;
    if (!selectedPlace) {
      Alert.alert("Place required", "Select a place for this memory.");
      return;
    }
    if (isSearchActive && !hasExplicitSelection) {
      Alert.alert("Place required", "Pick a place from the search results.");
      return;
    }
    continueToCreatePinFlow({
      images: draftImages,
      selectedPlace,
      moodScore: moodScore ?? undefined,
      feeling: feeling.trim() || undefined,
    });
  }, [
    draftImages,
    selectedPlace,
    moodScore,
    feeling,
    isSearchActive,
    hasExplicitSelection,
  ]);

  const goBack = useCallback(() => {
    safeBack("/photo-selection");
  }, []);

  const canConfirm =
    selectedPlace !== null &&
    !currentLocationLoading &&
    (!isSearchActive || hasExplicitSelection);

  return {
    venueName,
    setVenueName,
    coords,
    locationLoading: locationLoading || currentLocationLoading,
    permissionDenied,
    refreshLocation: refreshLocationAndUseGps,
    selectedPlace,
    selectPlace,
    searchResults,
    searchLoading,
    searchError,
    hasExplicitSelection,
    confirmAndContinue,
    goBack,
    canConfirm,
  };
}
