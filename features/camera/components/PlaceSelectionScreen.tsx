import Ionicons from "@expo/vector-icons/Ionicons";
import type { Href } from "expo-router";
import { memo, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconCircleButton } from "@/components/ui/icon-circle-button";
import { SkyBackground } from "@/components/ui/sky-background";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";
import { useCreatePinHandoffStore } from "@/features/create-pin/store/create-pin-handoff-store";
import { useMemoryFeed } from "@/features/feed/hooks/use-memory-feed";
import { createUnresolvedPlace } from "@/features/location/fallback-places";
import { useCurrentLocation } from "@/features/location/hooks/use-current-location";
import { useDebouncedPlaceSearch } from "@/features/location/hooks/use-debounced-place-search";
import { useReverseGeocodedPlace } from "@/features/location/hooks/use-reverse-geocoded-place";
import { useSuggestedPlaces } from "@/features/location/hooks/use-suggested-places";
import { safeBack } from "@/lib/navigation/safe-router";
import type { PlaceSuggestion } from "@/types/api";

const MIN_SEARCH_LENGTH = 2;
const RECENT_LIMIT = 6;

type Row =
  | { kind: "section"; key: string; label: string }
  | { kind: "place"; key: string; place: PlaceSuggestion; emoji: string }
  | { kind: "status"; key: string; text: string; loading?: boolean };

const PlaceRow = memo(function PlaceRow({
  emoji,
  title,
  subtitle,
  onPress,
  disabled,
  tint = AddyColors.paperDim,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
  tint?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      style={({ pressed }) => [
        styles.row,
        AddyShadow.soft,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: tint }]}>
        <Text style={styles.rowEmoji}>{emoji}</Text>
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
});

/** Place picker for the create flow; picking a row returns to create. */
export function PlaceSelectionScreen() {
  const setPlace = useCreatePinHandoffStore((s) => s.setPlace);
  return (
    <PlacePicker
      backHref="/create-pin"
      onPick={(place) => {
        setPlace(place, "picked");
        safeBack("/create-pin");
      }}
      onUseCurrentLocation={() => {
        // "auto" makes the create screen follow the device location again.
        setPlace(null, "auto");
        safeBack("/create-pin");
      }}
    />
  );
}

type PlacePickerProps = {
  /** Where the back button goes when there's no history. */
  backHref: Href;
  onPick: (place: PlaceSuggestion) => void;
  /** `here` is the geocoded current spot (or a bare GPS one), null if unknown. */
  onUseCurrentLocation: (here: PlaceSuggestion | null) => void;
};

/** Search, nearby and recent places; shared by the create and edit flows. */
export function PlacePicker({
  backHref,
  onPick,
  onUseCurrentLocation,
}: PlacePickerProps) {
  const [query, setQuery] = useState("");
  const trimmed = query.trim();
  const searching = trimmed.length >= MIN_SEARCH_LENGTH;

  const { coords, loading: locating, permissionDenied, refresh } =
    useCurrentLocation();
  useEffect(() => {
    void refresh();
  }, [refresh]);
  const { place: here, loading: geocoding } = useReverseGeocodedPlace(coords);
  const search = useDebouncedPlaceSearch(query, coords);
  const nearby = useSuggestedPlaces(coords);
  const { items: memories } = useMemoryFeed(true);

  const recent = useMemo(() => {
    const seen = new Set<string>();
    const places: PlaceSuggestion[] = [];
    for (const memory of memories) {
      const p = memory.place;
      if (seen.has(p.externalPlaceId)) continue;
      seen.add(p.externalPlaceId);
      places.push({
        placeId: p.externalPlaceId,
        name: p.name,
        address: p.formattedAddress,
        latitude: p.latitude,
        longitude: p.longitude,
      });
      if (places.length >= RECENT_LIMIT) break;
    }
    return places;
  }, [memories]);

  const pick = onPick;

  const chooseCurrentLocation = () => {
    onUseCurrentLocation(here ?? (coords ? createUnresolvedPlace(coords) : null));
  };

  // Typing a name that search doesn't know pins it at the current spot.
  const namedHere: PlaceSuggestion | null =
    searching && coords
      ? { ...(here ?? createUnresolvedPlace(coords)), name: trimmed }
      : null;

  const rows = useMemo<Row[]>(() => {
    if (searching) {
      const out: Row[] = [{ kind: "section", key: "s-results", label: "Results" }];
      if (search.loading) {
        out.push({ kind: "status", key: "loading", text: "Searching…", loading: true });
      } else if (search.error) {
        out.push({ kind: "status", key: "error", text: "Search isn't reachable right now." });
      } else if (search.results.length === 0) {
        out.push({ kind: "status", key: "empty", text: `No places found for "${trimmed}".` });
      }
      for (const place of search.results) {
        out.push({ kind: "place", key: `r-${place.placeId}`, place, emoji: "📍" });
      }
      return out;
    }

    const out: Row[] = [];
    if (nearby.places.length > 0) {
      out.push({ kind: "section", key: "s-nearby", label: "Nearby" });
      for (const place of nearby.places) {
        out.push({ kind: "place", key: `n-${place.placeId}`, place, emoji: "📍" });
      }
    }
    if (recent.length > 0) {
      out.push({ kind: "section", key: "s-recent", label: "Recent" });
      for (const place of recent) {
        out.push({ kind: "place", key: `p-${place.placeId}`, place, emoji: "🕘" });
      }
    }
    return out;
  }, [searching, search.loading, search.error, search.results, trimmed, nearby.places, recent]);

  let hereSubtitle: string;
  if (here) hereSubtitle = here.name;
  else if (permissionDenied) hereSubtitle = "location is off";
  else if (locating || geocoding) hereSubtitle = "finding where you are…";
  else hereSubtitle = "your GPS spot";

  return (
    <SkyBackground>
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <IconCircleButton
            icon="chevron-back"
            accessibilityLabel="Back"
            onPress={() => safeBack(backHref)}
          />
          <Text style={styles.title}>Choose place</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.searchWrap}>
          <View style={[styles.search, AddyShadow.soft]}>
            <Ionicons name="search" size={18} color={AddyColors.inkMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="search a place…"
              placeholderTextColor={AddyColors.inkMuted}
              style={styles.searchInput}
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Search places"
            />
            {query ? (
              <Pressable
                onPress={() => setQuery("")}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Ionicons name="close-circle" size={18} color={AddyColors.inkMuted} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <FlatList
          data={rows}
          keyExtractor={(row) => row.key}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            searching ? (
              namedHere ? (
                <PlaceRow
                  emoji="✏️"
                  title={`Name it "${trimmed}"`}
                  subtitle="pin at your current location"
                  tint={AddyColors.yellow}
                  onPress={() => pick(namedHere)}
                />
              ) : null
            ) : (
              <PlaceRow
                emoji="🧭"
                title="Use current location"
                subtitle={hereSubtitle}
                tint={AddyColors.cyan}
                disabled={permissionDenied}
                onPress={chooseCurrentLocation}
              />
            )
          }
          renderItem={({ item }) => {
            if (item.kind === "section") {
              return <Text style={styles.section}>{item.label}</Text>;
            }
            if (item.kind === "status") {
              return (
                <View style={styles.status}>
                  {item.loading ? (
                    <ActivityIndicator size="small" color={AddyColors.inkMuted} />
                  ) : null}
                  <Text style={styles.statusText}>{item.text}</Text>
                </View>
              );
            }
            return (
              <PlaceRow
                emoji={item.emoji}
                title={item.place.name}
                subtitle={item.place.address}
                onPress={() => pick(item.place)}
              />
            );
          }}
        />
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontFamily: AddyFonts.title,
    fontSize: 20,
    lineHeight: 30,
    color: AddyColors.ink,
  },
  headerSpacer: { width: 30 },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 8 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: AddyRadius.input,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  searchInput: {
    flex: 1,
    fontFamily: AddyFonts.body,
    fontSize: 15,
    color: AddyColors.ink,
    paddingVertical: 10,
  },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 10 },
  section: {
    fontFamily: AddyFonts.titleSemiBold,
    fontSize: 14,
    color: AddyColors.inkMuted,
    marginTop: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: AddyRadius.input,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  rowEmoji: { fontSize: 16 },
  rowText: { flex: 1, gap: 1 },
  rowTitle: {
    fontFamily: AddyFonts.bodySemiBold,
    fontSize: 15,
    color: AddyColors.ink,
  },
  rowSubtitle: {
    fontFamily: AddyFonts.body,
    fontSize: 12,
    color: AddyColors.inkMuted,
  },
  status: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  statusText: {
    fontFamily: AddyFonts.body,
    fontSize: 13,
    color: AddyColors.inkMuted,
  },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.5 },
});
