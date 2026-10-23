import {
  Camera,
  Map,
  Marker,
  type CameraRef,
  type LngLatBounds,
  type ViewStateChangeEvent,
} from "@maplibre/maplibre-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { TourTarget, useTourGuide } from "@wrack/react-native-tour-guide";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { NativeSyntheticEvent } from "react-native";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { ChatBubbleBanner } from "@/components/ui/chat-bubble-banner";
import { TechChip } from "@/components/ui/tech-chip";
import { LABEL_VISIBLE_ZOOM } from "@/constants/map-style";
import {
  AddyColors,
  AddyFonts,
  AddyRadius,
  BrandColors,
} from "@/constants/theme";
import {
  AllMemoriesSheet,
  type AllMemoriesSheetRef,
} from "@/features/map/components/all-memories-sheet";
import {
  ClusterPhotoPin,
  latestPin,
} from "@/features/map/components/cluster-marker";
import {
  ClusterPinsSheet,
  type ClusterPinsSheetRef,
} from "@/features/map/components/cluster-pins-sheet";
import {
  MAP_PHOTO_PIN_HEIGHT,
  MAP_PHOTO_PIN_WIDTH,
  MapPhotoPin,
} from "@/features/map/components/map-photo-pin";
import {
  PlaceMemoriesSheet,
  type PlaceMemoriesSheetRef,
} from "@/features/map/components/place-memories-sheet";
import { useMapFocusStore } from "@/features/map/store/map-focus-store";
import { useAddyMapStyle } from "@/features/map/utils/addy-map-style";
import {
  clusterPins,
  type ClusterGroup,
} from "@/features/map/utils/cluster-pins";
import {
  ONBOARDING_ADD_MEMORY_STEP_ID,
  ONBOARDING_MAP_PIN_TARGET_ID,
  ONBOARDING_TOUR_ID,
} from "@/features/onboarding/onboarding-tour";
import { usePinQueueStore } from "@/features/pin-queue/pin-queue-store";
import {
  queuedPinCoordinates,
  queuedPinPlaceName,
} from "@/features/pin-queue/pin-queue-types";
import { showQueuedPinActions } from "@/features/pin-queue/queued-pin-actions";
import { IconCircleButton } from "@/components/ui/icon-circle-button";
import { userDisplayName } from "@/components/ui/user-row";
import { useFriendSheetsStore } from "@/features/friends/store/friend-sheets-store";
import {
  useFriendsMapQuery,
  useFriendsQuery,
  useMemoriesMapQuery,
  useMemoryQuery,
  useStatsQuery,
} from "@/lib/query/hooks";
import type { FriendMemoryPin, MapBounds, MemoryPin } from "@/types/api";

// MapPhotoPin's visual footprint (features/map/components/map-photo-pin.tsx),
// extending UPWARD from the marker's anchor="bottom" point.
const MARKER_VISUAL_WIDTH = MAP_PHOTO_PIN_WIDTH;
const MARKER_VISUAL_HEIGHT = MAP_PHOTO_PIN_HEIGHT;
const HIGHLIGHT_PADDING = 12;

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

function boundsToMapBounds([
  west,
  south,
  east,
  north,
]: LngLatBounds): MapBounds {
  return { north, south, east, west, limit: 50 };
}

// MapLibre markers are native layers with no DOM measurement — approximate
// a pin's screen-X position by interpolating its longitude across the
// current viewport bounds. Ignores Mercator curvature/rotation, which is
// fine since this map never rotates or pitches.
function isNearRightEdge(longitude: number, bounds: MapBounds): boolean {
  const span = bounds.east - bounds.west;
  if (span <= 0) return false;
  const ratio = (longitude - bounds.west) / span;
  return ratio > 0.6;
}

function ToastSparkle({
  visible,
  delayMs,
  style,
}: {
  visible: boolean;
  delayMs: number;
  style: object;
}) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = visible
      ? withDelay(
          delayMs,
          withSequence(
            withTiming(1, { duration: 150 }),
            withTiming(0, { duration: 400 }),
          ),
        )
      : withTiming(0, { duration: 0 });
  }, [visible, delayMs, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Text style={[styles.toastSparkle, style, animatedStyle]}>
      ✦
    </Animated.Text>
  );
}

function SuccessToast({ visible }: { visible: boolean }) {
  return (
    <ChatBubbleBanner visible={visible}>
      <Text style={styles.toastText}>📍 Memory pinned!</Text>
      <ToastSparkle
        visible={visible}
        delayMs={200}
        style={styles.toastSparkleLeft}
      />
      <ToastSparkle
        visible={visible}
        delayMs={320}
        style={styles.toastSparkleRight}
      />
    </ChatBubbleBanner>
  );
}

export function MemoriesMapScreen() {
  const mapStyle = useAddyMapStyle();
  const cameraRef = useRef<CameraRef>(null);
  const placeMemoriesSheetRef = useRef<PlaceMemoriesSheetRef>(null);
  const allMemoriesSheetRef = useRef<AllMemoriesSheetRef>(null);
  const clusterPinsSheetRef = useRef<ClusterPinsSheetRef>(null);
  const pendingFocus = useMapFocusStore((s) => s.pendingFocus);
  const setPendingFocus = useMapFocusStore((s) => s.setPendingFocus);
  const showSuccessToast = useMapFocusStore((s) => s.showSuccessToast);
  const setShowSuccessToast = useMapFocusStore((s) => s.setShowSuccessToast);

  const { activeTourId, currentStep, activeSteps, nextStep, resumeTour } =
    useTourGuide();

  const [debouncedBounds, setDebouncedBounds] = useState<MapBounds | null>(
    DEFAULT_BOUNDS,
  );
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

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

          // The tour was paused for the create flow. Resume only now, with the
          // modals dismissed: the overlay measures its own screen origin when
          // it re-mounts, and a page-sheet modal still on screen shifts that
          // by the card offset for every later step. The highlight target is
          // always centered over the pin (see the TourTarget below), so the
          // tour can advance right away.
          resumeTour();
          nextStep();
        }, 650);

        return () => clearTimeout(settleTimer);
      }, 350);

      return () => clearTimeout(timer);
    }, [
      pendingFocus,
      setPendingFocus,
      activeTourId,
      currentStep,
      activeSteps,
      nextStep,
      resumeTour,
    ]),
  );

  // Auto-dismiss the success toast
  useEffect(() => {
    if (!showSuccessToast) return;
    const timer = setTimeout(
      () => setShowSuccessToast(false),
      TOAST_VISIBLE_MS,
    );
    return () => clearTimeout(timer);
  }, [showSuccessToast, setShowSuccessToast]);

  const onRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      const { bounds, zoom: nextZoom } = event.nativeEvent;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setDebouncedBounds(boundsToMapBounds(bounds));
        setZoom(nextZoom);
      }, 400);
    },
    [],
  );

  const [showFriends, setShowFriends] = useState(false);

  // "See {name}'s map": ?friend=<userId> shows only that friend's pins;
  // ?memory=<id> (their latest) is where the camera flies to.
  const params = useLocalSearchParams<{ friend?: string; memory?: string }>();
  const focusFriendId = params.friend || null;
  const friendsQuery = useFriendsQuery(Boolean(focusFriendId));
  const focusFriend = focusFriendId
    ? friendsQuery.data?.pages
        .flatMap((p) => p.items)
        .find((f) => f.user.id === focusFriendId)
    : undefined;
  const focusFriendName = focusFriend
    ? userDisplayName(focusFriend.user)
    : "friend";
  const focusMemoryId =
    params.memory || focusFriend?.lastSharedMemory?.memoryId || undefined;
  const { data: focusMemory } = useMemoryQuery(
    focusFriendId ? focusMemoryId : undefined,
  );
  const flownToRef = useRef<string | null>(null);
  useEffect(() => {
    if (!focusFriendId || !focusMemory) return;
    const key = `${focusFriendId}:${focusMemory.id}`;
    if (flownToRef.current === key) return;
    flownToRef.current = key;
    cameraRef.current?.flyTo({
      center: [focusMemory.place.longitude, focusMemory.place.latitude],
      zoom: 13,
      duration: 600,
    });
  }, [focusFriendId, focusMemory]);
  const clearFriendFocus = useCallback(() => {
    flownToRef.current = null;
    router.setParams({ friend: undefined, memory: undefined });
  }, []);
  // Removed or blocked them from the menu: back to your own map. Only once
  // the whole friends list is loaded, so a later page isn't mistaken for it.
  const friendGone =
    focusFriendId !== null &&
    friendsQuery.isSuccess &&
    !friendsQuery.isFetching &&
    !friendsQuery.hasNextPage &&
    !focusFriend;
  useEffect(() => {
    if (friendGone) clearFriendFocus();
  }, [friendGone, clearFriendFocus]);

  const friendsLayerOn = showFriends || focusFriendId !== null;
  const bounds = debouncedBounds ?? DEFAULT_BOUNDS;
  const showLabels = zoom >= LABEL_VISIBLE_ZOOM;

  const { data, isError } = useMemoriesMapQuery(debouncedBounds);
  // Stable references so clustering (now heavier, with photo pins) only
  // reruns when the data or zoom actually changes.
  // Your own pins step aside while you look at one friend's map.
  const pins = useMemo(
    () => (focusFriendId ? [] : (data?.pins ?? [])),
    [focusFriendId, data?.pins],
  );

  const { data: friendsData, isLoading: isFriendsMapLoading } =
    useFriendsMapQuery(friendsLayerOn ? debouncedBounds : null);
  const friendPins = useMemo(() => {
    if (!friendsLayerOn) return [];
    const all = friendsData?.pins ?? [];
    return focusFriendId
      ? all.filter((pin) => pin.author.id === focusFriendId)
      : all;
  }, [friendsLayerOn, focusFriendId, friendsData?.pins]);
  const showFriendsEmptyHint =
    friendsLayerOn && !isFriendsMapLoading && friendPins.length === 0;

  // Not-yet-uploaded pins: drawn on top, never clustered.
  const allQueuedPins = usePinQueueStore((s) => s.entries);
  const queuedPins = focusFriendId ? [] : allQueuedPins;

  const { data: stats, isLoading: isStatsLoading } = useStatsQuery();
  const totalMemories = stats?.totalMemories;

  // Own-pins-only, unclustered, so the line reflects true pin-to-pin
  // chronological order rather than cluster centroids.

  // Clustered separately so own vs. friend pins never merge into one bubble —
  // keeps the bordered/unbordered visual distinction between them intact.
  const ownClusters = useMemo(() => clusterPins(pins, zoom), [pins, zoom]);
  const friendClusters = useMemo(
    () => clusterPins(friendPins, zoom),
    [friendPins, zoom],
  );

  const openFeed = useCallback(() => {
    allMemoriesSheetRef.current?.present();
  }, []);

  const onSelectSheetPin = useCallback(
    (latitude: number, longitude: number) => {
      setPendingFocus({ latitude, longitude });
    },
    [setPendingFocus],
  );

  const openPin = useCallback(
    (pin: { id: string; placeId: string; memoryCount: number }) => {
      if (pin.memoryCount > 1) {
        placeMemoriesSheetRef.current?.present(pin.placeId);
      } else {
        router.push(`/memory/${pin.id}`);
      }
    },
    [],
  );

  // A grouped pin opens a picker of the memories inside it, newest first.
  const onClusterPress = useCallback(
    (group: ClusterGroup<MemoryPin | FriendMemoryPin>) => {
      const newestFirst = [...group.pins].sort((a, b) =>
        b.capturedAt.localeCompare(a.capturedAt),
      );
      clusterPinsSheetRef.current?.present(newestFirst);
    },
    [],
  );

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
    <View style={styles.flex}>
      {/* Hold the map until the restyled base loads, so the stock Goong
          style never flashes first. */}
      {mapStyle ? (
        <Map
          style={styles.map}
          mapStyle={mapStyle}
          onRegionDidChange={onRegionDidChange}
        >
          <Camera
            ref={cameraRef}
            initialViewState={{ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }}
          />
          {friendClusters.map((group) =>
            group.pins.length > 1 ? (
              <Marker
                key={`friend-cluster-${latestPin(group.pins).id}`}
                lngLat={[
                  latestPin(group.pins).longitude,
                  latestPin(group.pins).latitude,
                ]}
                anchor="bottom"
                onPress={() => onClusterPress(group)}
              >
                <ClusterPhotoPin pins={group.pins} />
              </Marker>
            ) : (
              <Marker
                key={`friend-${group.pins[0].id}`}
                lngLat={[group.pins[0].longitude, group.pins[0].latitude]}
                anchor="bottom"
                onPress={() => openPin(group.pins[0])}
              >
                <MapPhotoPin
                  imageUrl={group.pins[0].imageUrl}
                  pinColor={"#5FCBFF"}
                  placeMemoryCount={group.pins[0].memoryCount}
                  extraPhotoCount={group.pins[0].extraPhotoCount}
                  placeName={group.pins[0].placeName}
                  moodScore={group.pins[0].moodScore}
                  showLabel={showLabels}
                  flipped={isNearRightEdge(group.pins[0].longitude, bounds)}
                  isFriend
                />
              </Marker>
            ),
          )}
          {ownClusters.map((group) =>
            group.pins.length > 1 ? (
              <Marker
                key={`cluster-${latestPin(group.pins).id}`}
                lngLat={[
                  latestPin(group.pins).longitude,
                  latestPin(group.pins).latitude,
                ]}
                anchor="bottom"
                onPress={() => onClusterPress(group)}
              >
                <ClusterPhotoPin pins={group.pins} />
              </Marker>
            ) : (
              <Marker
                key={group.pins[0].id}
                lngLat={[group.pins[0].longitude, group.pins[0].latitude]}
                anchor="bottom"
                onPress={() => openPin(group.pins[0])}
              >
                <MapPhotoPin
                  imageUrl={group.pins[0].imageUrl}
                  pinColor={"#5FCBFF"}
                  placeMemoryCount={group.pins[0].memoryCount}
                  extraPhotoCount={group.pins[0].extraPhotoCount}
                  placeName={group.pins[0].placeName}
                  moodScore={group.pins[0].moodScore}
                  showLabel={showLabels}
                  flipped={isNearRightEdge(group.pins[0].longitude, bounds)}
                />
              </Marker>
            ),
          )}
          {queuedPins.map((pin) => {
            const { latitude, longitude } = queuedPinCoordinates(pin);
            return (
              <Marker
                key={`queued-${pin.clientId}`}
                lngLat={[longitude, latitude]}
                anchor="bottom"
                onPress={() => showQueuedPinActions(pin)}
              >
                <MapPhotoPin
                  imageUrl={pin.photoPaths[0]}
                  pinColor={"#5FCBFF"}
                  placeName={queuedPinPlaceName(pin)}
                  moodScore={pin.moodScore}
                  showLabel={showLabels}
                  flipped={isNearRightEdge(longitude, bounds)}
                  queueStatus={pin.status === "failed" ? "failed" : "pending"}
                />
              </Marker>
            );
          })}
        </Map>
      ) : (
        <View style={styles.map} />
      )}

      {/* Invisible target for the onboarding tour's "map + pin" step. After
          flyTo, the new pin's tip sits at the map's center, so the target is
          laid out around that center by flexbox — in the same container as
          the map, so it can't drift from it the way a measured offset can.
          TourTarget measures its own wrapper, so the size lives on it. */}
      <View pointerEvents="none" style={styles.pinHighlightFrame}>
        <TourTarget
          id={ONBOARDING_MAP_PIN_TARGET_ID}
          style={styles.pinHighlightTarget}
        >
          <View style={styles.flex} />
        </TourTarget>
      </View>

      <SafeAreaView
        style={styles.overlay}
        edges={["top"]}
        pointerEvents="box-none"
      >
        <SuccessToast visible={showSuccessToast} />
        <View style={styles.topRow} pointerEvents="box-none">
          <TechChip
            tone="dark"
            label={
              totalMemories == null
                ? isStatsLoading
                  ? "loading…"
                  : `${pins.length} memories`
                : totalMemories === 1
                  ? "1 memory"
                  : `${totalMemories} memories`
            }
            trailing={isError && totalMemories == null ? "· offline ›" : "›"}
            onPress={openFeed}
            accessibilityLabel="Show all your memories"
          />
          {focusFriendId ? (
            <TechChip
              tone="pink"
              leading="🗺️"
              label={`${focusFriendName}'s map`}
              trailing="×"
              onPress={clearFriendFocus}
              accessibilityLabel={`Close ${focusFriendName}'s map`}
            />
          ) : null}
          {focusFriend ? (
            <IconCircleButton
              icon="ellipsis-horizontal"
              size={30}
              accessibilityLabel={`More options for ${focusFriendName}`}
              onPress={() =>
                useFriendSheetsStore.getState().openFriendMenu({
                  user: focusFriend.user,
                  friendsSince: focusFriend.friendsSince,
                })
              }
            />
          ) : null}
          {focusFriendId ? null : (
            <Pressable
              onPress={() => setShowFriends((v) => !v)}
              hitSlop={10}
              accessibilityRole="switch"
              accessibilityState={{ checked: showFriends }}
              accessibilityLabel="Show friends' memories on the map"
            >
              <TechChip
                tone={showFriends ? "pink" : "paper"}
                leading="👥"
                label="Friends"
              />
            </Pressable>
          )}
        </View>
        {showFriendsEmptyHint ? (
          <Text style={styles.friendsHintText}>
            {focusFriendId
              ? `No memories from ${focusFriendName} here yet`
              : "No friends' memories here yet"}
          </Text>
        ) : null}
      </SafeAreaView>

      <PlaceMemoriesSheet ref={placeMemoriesSheetRef} />
      <AllMemoriesSheet
        ref={allMemoriesSheetRef}
        onSelectPin={onSelectSheetPin}
      />
      <ClusterPinsSheet
        ref={clusterPinsSheetRef}
        onSelectMemory={(memoryId) => router.push(`/memory/${memoryId}`)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  map: { flex: 1, backgroundColor: AddyColors.mapBg },
  pinHighlightFrame: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  // Centered box, lifted by the marker height (marginBottom shifts a centered
  // box up by half of it): spans [center - H - pad, center + pad] vertically,
  // i.e. the pin (which extends up from its tip at the center) plus padding.
  pinHighlightTarget: {
    width: MARKER_VISUAL_WIDTH + HIGHLIGHT_PADDING * 2,
    height: MARKER_VISUAL_HEIGHT + HIGHLIGHT_PADDING * 2,
    marginBottom: MARKER_VISUAL_HEIGHT,
  },
  safe: { flex: 1, backgroundColor: BrandColors.paper },
  overlay: { position: "absolute", top: 0, left: 0, right: 0 },

  toastText: {
    color: BrandColors.ink,
    fontSize: 14,
    fontFamily: "Baloo2-SemiBold",
    letterSpacing: 0.2,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toastSparkle: {
    position: "absolute",
    fontSize: 16,
    color: BrandColors.accentYellow,
  },
  toastSparkleLeft: { top: -6, left: 18 },
  toastSparkleRight: { top: -4, right: 22 },

  friendsHintText: {
    alignSelf: "flex-start",
    marginHorizontal: 16,
    marginTop: -8,
    backgroundColor: AddyColors.paperDim,
    color: AddyColors.inkMuted,
    fontSize: 16,
    fontFamily: AddyFonts.tech,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: AddyRadius.chip,
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    margin: 16,
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
