import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Camera,
  Map,
  Marker,
  type CameraRef,
  type LngLatBounds,
  type ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import type { NativeSyntheticEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { TourTarget, useTourGuide } from "@wrack/react-native-tour-guide";

import { GOONG_MAP_API_KEY } from "@/lib/env";
import {
  useFriendsMapQuery,
  useMemoriesMapQuery,
  useStatsQuery,
} from "@/lib/query/hooks";
import type { MapBounds } from "@/types/api";
import { BrandColors } from "@/constants/theme";
import { PolaroidMapMarker } from "@/features/map/components/polaroid-map-marker";
import { useMapFocusStore } from "@/features/map/store/map-focus-store";
import {
  ONBOARDING_ADD_MEMORY_STEP_ID,
  ONBOARDING_MAP_PIN_TARGET_ID,
  ONBOARDING_TOUR_ID,
} from "@/features/onboarding/onboarding-tour";

// The polaroid marker's visual footprint (features/map/components/polaroid-map-marker.tsx):
// PIN_SIZE(28) + POLAROID_HEIGHT(71) - 6px overlap, extending UPWARD from the
// marker's anchor="bottom" point.
const MARKER_VISUAL_WIDTH = 66;
const MARKER_VISUAL_HEIGHT = 93;
const HIGHLIGHT_PADDING = 12;

const GOONG_STYLE_URL = `https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAP_API_KEY}`;

const DEFAULT_CENTER: [number, number] = [106.660172, 10.762622];
const DEFAULT_ZOOM = 13;
const DEFAULT_BOUNDS_DELTA = 0.04;
const DEFAULT_BOUNDS: MapBounds = {
  north: DEFAULT_CENTER[1] + DEFAULT_BOUNDS_DELTA,
  south: DEFAULT_CENTER[1] - DEFAULT_BOUNDS_DELTA,
  east: DEFAULT_CENTER[0] + DEFAULT_BOUNDS_DELTA,
  west: DEFAULT_CENTER[0] - DEFAULT_BOUNDS_DELTA,
  limit: 50,
};

const TOAST_VISIBLE_MS = 3000;

function boundsToMapBounds([west, south, east, north]: LngLatBounds): MapBounds {
  return { north, south, east, west, limit: 50 };
}

function SuccessToast() {
  const translateY = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [translateY]);

  return (
    <Animated.View style={[styles.toast, { transform: [{ translateY }] }]}>
      <Text style={styles.toastText}>📍 Memory pinned!</Text>
    </Animated.View>
  );
}

export function MemoriesMapScreen() {
  const cameraRef = useRef<CameraRef>(null);
  const mapContainerRef = useRef<View>(null);
  const pendingFocus = useMapFocusStore((s) => s.pendingFocus);
  const setPendingFocus = useMapFocusStore((s) => s.setPendingFocus);
  const showSuccessToast = useMapFocusStore((s) => s.showSuccessToast);
  const setShowSuccessToast = useMapFocusStore((s) => s.setShowSuccessToast);

  const { activeTourId, currentStep, activeSteps, nextStep } = useTourGuide();
  const [pinHighlight, setPinHighlight] = useState({
    width: MARKER_VISUAL_WIDTH + HIGHLIGHT_PADDING * 2,
    height: MARKER_VISUAL_HEIGHT + HIGHLIGHT_PADDING * 2,
    left: 0,
    top: 0,
  });

  const [debouncedBounds, setDebouncedBounds] = useState<MapBounds | null>(
    DEFAULT_BOUNDS,
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Zoom to a newly created pin once this tab is focused and the map is ready.
  useFocusEffect(
    useCallback(() => {
      if (!pendingFocus) return;
      const { latitude, longitude } = pendingFocus;

      const timer = setTimeout(() => {
        cameraRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 15,
          duration: 600,
        });
        setPendingFocus(null);

        // flyTo has no completion callback — wait out its duration (plus a
        // buffer) before measuring where the pin actually landed on screen.
        const settleTimer = setTimeout(() => {
          const isOnboardingAddMemoryStep =
            activeTourId === ONBOARDING_TOUR_ID &&
            activeSteps[currentStep]?.id === ONBOARDING_ADD_MEMORY_STEP_ID;
          if (!isOnboardingAddMemoryStep) return;

          mapContainerRef.current?.measure((_x, _y, width, height) => {
            setPinHighlight({
              width: MARKER_VISUAL_WIDTH + HIGHLIGHT_PADDING * 2,
              height: MARKER_VISUAL_HEIGHT + HIGHLIGHT_PADDING * 2,
              left: width / 2 - (MARKER_VISUAL_WIDTH + HIGHLIGHT_PADDING * 2) / 2,
              top: height / 2 - MARKER_VISUAL_HEIGHT - HIGHLIGHT_PADDING * 2,
            });
            nextStep();
          });
        }, 650);

        return () => clearTimeout(settleTimer);
      }, 350);

      return () => clearTimeout(timer);
    }, [pendingFocus, setPendingFocus, activeTourId, currentStep, activeSteps, nextStep]),
  );

  // Auto-dismiss the success toast
  useEffect(() => {
    if (!showSuccessToast) return;
    const timer = setTimeout(() => setShowSuccessToast(false), TOAST_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [showSuccessToast, setShowSuccessToast]);

  const onRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      const { bounds } = event.nativeEvent;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setDebouncedBounds(boundsToMapBounds(bounds));
      }, 400);
    },
    [],
  );

  const [showFriends, setShowFriends] = useState(false);

  const { data, isError } = useMemoriesMapQuery(debouncedBounds);
  const pins = data?.pins ?? [];

  const { data: friendsData, isLoading: isFriendsMapLoading } =
    useFriendsMapQuery(showFriends ? debouncedBounds : null);
  const friendPins = showFriends ? (friendsData?.pins ?? []) : [];
  const showFriendsEmptyHint =
    showFriends && !isFriendsMapLoading && friendPins.length === 0;

  const { data: stats, isLoading: isStatsLoading } = useStatsQuery();
  const totalMemories = stats?.totalMemories;

  const openFeed = useCallback(() => {
    router.push("/(app)/memories");
  }, []);

  if (Platform.OS === "web") {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.webFallback}>
          <Text style={styles.webTitle}>Map on your phone</Text>
          <Text style={styles.webBody}>
            Memory pins use native maps. Open Addy in a dev build on iOS or
            Android to explore your memories on the map.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.flex} ref={mapContainerRef}>
      <Map
        style={styles.map}
        mapStyle={GOONG_STYLE_URL}
        onRegionDidChange={onRegionDidChange}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }}
        />
        {friendPins.map((pin) => (
          <Marker
            key={`friend-${pin.id}`}
            lngLat={[pin.longitude, pin.latitude]}
            anchor="bottom"
            onPress={() => router.push(`/memory/${pin.id}`)}
          >
            <View style={styles.friendMarker}>
              <PolaroidMapMarker imageUrl={pin.imageUrl} />
            </View>
          </Marker>
        ))}
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            lngLat={[pin.longitude, pin.latitude]}
            anchor="bottom"
            onPress={() => router.push(`/memory/${pin.id}`)}
          >
            <PolaroidMapMarker imageUrl={pin.imageUrl} />
          </Marker>
        ))}
      </Map>

      {/* Invisible target for the onboarding tour's "map + pin" step — see
          the pendingFocus effect above for how its position is computed. */}
      <TourTarget id={ONBOARDING_MAP_PIN_TARGET_ID}>
        <View
          pointerEvents="none"
          style={[styles.pinHighlightTarget, pinHighlight]}
        />
      </TourTarget>

      <SafeAreaView
        style={styles.overlay}
        edges={["top"]}
        pointerEvents="box-none"
      >
        {showSuccessToast ? <SuccessToast /> : null}
        <View style={styles.topRow}>
        <Pressable
          onPress={openFeed}
          style={({ pressed }) => [
            styles.badge,
            pressed && styles.badgePressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Show all your memories"
        >
          <Text style={styles.badgeText}>
            {totalMemories == null
              ? isStatsLoading
                ? "Loading…"
                : `${pins.length} memories`
              : totalMemories === 1
                ? "1 memory"
                : `${totalMemories} memories`}
            {isError && totalMemories == null ? " · offline" : ""}
          </Text>
          <Text style={styles.badgeChevron}>›</Text>
        </Pressable>
        <Pressable
          onPress={() => setShowFriends((v) => !v)}
          style={[styles.friendsChip, showFriends && styles.friendsChipOn]}
          accessibilityRole="switch"
          accessibilityState={{ checked: showFriends }}
          accessibilityLabel="Show friends' memories on the map"
        >
          <Text
            style={[
              styles.friendsChipText,
              showFriends && styles.friendsChipTextOn,
            ]}
          >
            Friends
          </Text>
        </Pressable>
        </View>
        {showFriendsEmptyHint ? (
          <View style={styles.friendsHintRow}>
            <Text style={styles.friendsHintText}>
              No friends' memories here yet
            </Text>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  map: { flex: 1 },
  pinHighlightTarget: { position: "absolute" },
  safe: { flex: 1, backgroundColor: BrandColors.gray900 },
  overlay: { position: "absolute", top: 0, left: 0, right: 0 },

  toast: {
    alignSelf: "center",
    backgroundColor: BrandColors.gray900,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: BrandColors.neutral,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    margin: 16,
  },
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(43, 28, 33, 0.92)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  friendsChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(43, 28, 33, 0.92)",
  },
  friendsChipOn: { backgroundColor: BrandColors.primary },
  friendsChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: BrandColors.neutralMuted,
  },
  friendsChipTextOn: { color: BrandColors.white },
  friendsHintRow: {
    alignItems: "center",
    marginTop: -8,
  },
  friendsHintText: {
    backgroundColor: "rgba(43, 28, 33, 0.92)",
    color: BrandColors.neutralMuted,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    overflow: "hidden",
  },
  friendMarker: {
    borderWidth: 2,
    borderColor: BrandColors.primary,
    borderRadius: 10,
  },
  badgePressed: { opacity: 0.7 },
  badgeText: { fontSize: 14, fontWeight: "600", color: BrandColors.neutral },
  badgeChevron: {
    fontSize: 18,
    lineHeight: 18,
    fontWeight: "700",
    color: BrandColors.neutralMuted,
  },
  webFallback: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 12,
  },
  webTitle: { fontSize: 20, fontWeight: "700", color: BrandColors.neutral },
  webBody: { fontSize: 15, color: BrandColors.neutralMuted, lineHeight: 22 },
});
