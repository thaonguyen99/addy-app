import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BrandColors } from "@/constants/theme";
import { PlaceSuggestionRow } from "@/features/camera/components/place-suggestion-row";
import { cameraLayout } from "@/features/camera/styles/shared-styles";
import { useSuggestedPlaces } from "@/features/location/hooks/use-suggested-places";
import type { Coordinates } from "@/features/location/get-current-coordinates";
import type { PlaceSuggestion } from "@/types/api";

const MIN_SEARCH_LENGTH = 2;

type PlacePickerSectionProps = Readonly<{
  coords: Coordinates | null;
  locationLoading: boolean;
  permissionDenied: boolean;
  selectedPlace: PlaceSuggestion | null;
  onSelectPlace: (place: PlaceSuggestion) => void;
  onRefreshLocation: () => void;
  searchQuery?: string;
  searchResults?: PlaceSuggestion[];
  searchLoading?: boolean;
  searchError?: string | null;
  hasExplicitSelection?: boolean;
}>;

function PlaceSkeletonRows() {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.skeletonRow} />
      ))}
    </View>
  );
}

export function PlacePickerSection({
  coords,
  locationLoading,
  permissionDenied,
  selectedPlace,
  onSelectPlace,
  onRefreshLocation,
  searchQuery = "",
  searchResults = [],
  searchLoading = false,
  searchError = null,
  hasExplicitSelection = false,
}: PlacePickerSectionProps) {
  const suggested = useSuggestedPlaces(coords);

  const trimmedQuery = searchQuery.trim();
  const isSearchActive = trimmedQuery.length >= MIN_SEARCH_LENGTH;
  const hasSearchResults = searchResults.length > 0;
  const hasNearbyResults = suggested.places.length > 0;

  const activeList = isSearchActive
    ? searchResults
    : hasNearbyResults
      ? suggested.places
      : [];
  const hasActiveList = activeList.length > 0;
  const showDefaultPlace =
    !isSearchActive && !hasActiveList && selectedPlace !== null;

  let listSectionLabel: string;
  if (isSearchActive) {
    listSectionLabel = "Results";
  } else if (hasNearbyResults) {
    listSectionLabel = suggested.sectionLabel;
  } else {
    listSectionLabel = "Location";
  }

  const listLoading = isSearchActive
    ? searchLoading
    : locationLoading || (hasNearbyResults && suggested.loading);

  const showSelectedChip =
    selectedPlace !== null && (!isSearchActive || hasExplicitSelection);

  return (
    <View style={styles.wrap}>
      {permissionDenied ? (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Location off — enable it in Settings to pin this memory.
          </Text>
          <Pressable
            onPress={() => void Linking.openSettings()}
            style={styles.settingsBtn}
          >
            <Text style={styles.settingsBtnText}>Open Settings</Text>
          </Pressable>
        </View>
      ) : null}

      {showSelectedChip ? (
        <View style={styles.selectedChip}>
          <MaterialIcons
            name="place"
            size={18}
            color={BrandColors.primaryPink}
          />
          <View style={styles.selectedTextWrap}>
            <Text style={styles.selectedName} numberOfLines={1}>
              {selectedPlace.name}
            </Text>
            <Text style={styles.selectedAddress} numberOfLines={1}>
              {selectedPlace.address}
            </Text>
          </View>
        </View>
      ) : null}

      <View style={styles.listHeader}>
        <Text style={styles.listLabel}>{listSectionLabel}</Text>
        {!permissionDenied && coords && !isSearchActive ? (
          <Pressable onPress={onRefreshLocation} hitSlop={8}>
            <MaterialIcons
              name="my-location"
              size={18}
              color={BrandColors.gray400}
            />
          </Pressable>
        ) : null}
      </View>

      {listLoading ? (
        <PlaceSkeletonRows />
      ) : isSearchActive && searchError ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{searchError}</Text>
          <Text style={styles.emptyHint}>
            Check that the API server is reachable from this device.
          </Text>
        </View>
      ) : isSearchActive && !hasSearchResults ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            No places found for "{trimmedQuery}".
          </Text>
        </View>
      ) : suggested.isError && hasNearbyResults && !isSearchActive ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Could not load nearby places.</Text>
          <Pressable onPress={() => suggested.refetch()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        </View>
      ) : hasActiveList ? (
        <View style={styles.list}>
          {activeList.map((place) => (
            <PlaceSuggestionRow
              key={place.placeId}
              place={place}
              selected={selectedPlace?.placeId === place.placeId}
              onPress={onSelectPlace}
            />
          ))}
        </View>
      ) : showDefaultPlace ? (
        <View style={styles.list}>
          <PlaceSuggestionRow
            place={selectedPlace}
            selected={hasExplicitSelection}
            onPress={onSelectPlace}
          />
        </View>
      ) : (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            Search for a place or use your current location.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: cameraLayout.screenPaddingHorizontal,
    paddingTop: 8,
    gap: 10,
  },
  banner: {
    gap: 8,
    padding: 12,
    borderRadius: cameraLayout.cornerRadiusMd,
    backgroundColor: BrandColors.gray800,
    borderWidth: 1,
    borderColor: BrandColors.gray700,
  },
  bannerText: {
    fontSize: 13,
    color: BrandColors.gray400,
    lineHeight: 18,
  },
  settingsBtn: {
    alignSelf: "flex-start",
  },
  settingsBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: BrandColors.primaryPink,
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: cameraLayout.cornerRadiusMd,
    borderWidth: 1,
    borderColor: BrandColors.primaryPink,
    backgroundColor: "rgba(242, 97, 156, 0.12)",
  },
  selectedTextWrap: {
    flex: 1,
    gap: 2,
  },
  selectedName: {
    fontSize: 14,
    fontWeight: "600",
    color: BrandColors.gray50,
  },
  selectedAddress: {
    fontSize: 12,
    color: BrandColors.gray400,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: BrandColors.gray500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  list: {
    gap: 8,
  },
  skeletonWrap: {
    gap: 8,
  },
  skeletonRow: {
    height: 56,
    borderRadius: cameraLayout.cornerRadiusMd,
    backgroundColor: BrandColors.gray800,
  },
  emptyWrap: {
    paddingVertical: 12,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: BrandColors.gray500,
    textAlign: "center",
  },
  emptyHint: {
    fontSize: 12,
    color: BrandColors.gray600,
    textAlign: "center",
    lineHeight: 18,
  },
  retryBtn: {
    alignSelf: "center",
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: BrandColors.primaryPink,
  },
});
