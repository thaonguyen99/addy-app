import { useIsFocused } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";

import { continueToCreatePinFlow } from "@/features/create-pin/continue-to-create-pin";
import { useCreatePinHandoffStore } from "@/features/create-pin/store/create-pin-handoff-store";
import { buildPlaceFromCoordinates } from "@/features/location/build-place-from-coordinates";
import {
  createHoChiMinhCityPlace,
  HCM_MANUAL_PLACE_ID,
} from "@/features/location/fallback-places";
import { useCurrentLocation } from "@/features/location/hooks/use-current-location";
import { useDebouncedPlaceSearch } from "@/features/location/hooks/use-debounced-place-search";
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
  const [buildingPlace, setBuildingPlace] = useState(false);
  const isFocused = useIsFocused();

  const apiSelectedPlaceRef = useRef<PlaceSuggestion | null>(null);
  const useGpsPlaceRef = useRef(false);
  const manualPlaceIdRef = useRef<string>(HCM_MANUAL_PLACE_ID);

  const isSearchActive = venueName.trim().length >= MIN_SEARCH_LENGTH;

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

  useEffect(() => {
    if (isSearchActive) return;
    if (apiSelectedPlaceRef.current) return;
    setSelectedPlace(createHoChiMinhCityPlace({ name: debouncedVenueName }));
    setHasExplicitSelection(false);
  }, [debouncedVenueName, isSearchActive]);

  useEffect(() => {
    if (!coords || apiSelectedPlaceRef.current || !useGpsPlaceRef.current) {
      return;
    }

    let cancelled = false;
    setBuildingPlace(true);

    void (async () => {
      try {
        const place = await buildPlaceFromCoordinates(coords, {
          name: debouncedVenueName,
          placeId: manualPlaceIdRef.current,
        });
        if (!cancelled) {
          manualPlaceIdRef.current = place.placeId;
          setSelectedPlace(place);
        }
      } catch {
        if (!cancelled) {
          setSelectedPlace(createHoChiMinhCityPlace({ name: debouncedVenueName }));
        }
      } finally {
        if (!cancelled) {
          setBuildingPlace(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [coords, debouncedVenueName]);

  const selectPlace = useCallback((place: PlaceSuggestion) => {
    setHasExplicitSelection(true);
    if (isManualPlace(place)) {
      apiSelectedPlaceRef.current = null;
      useGpsPlaceRef.current = place.placeId !== HCM_MANUAL_PLACE_ID;
      manualPlaceIdRef.current = place.placeId;
    } else {
      apiSelectedPlaceRef.current = place;
      useGpsPlaceRef.current = false;
      manualPlaceIdRef.current = HCM_MANUAL_PLACE_ID;
    }
    setSelectedPlace(place);
  }, []);

  const refreshLocationAndUseGps = useCallback(() => {
    useGpsPlaceRef.current = true;
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
    !buildingPlace &&
    (!isSearchActive || hasExplicitSelection);

  return {
    venueName,
    setVenueName,
    coords,
    locationLoading: locationLoading || buildingPlace,
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
