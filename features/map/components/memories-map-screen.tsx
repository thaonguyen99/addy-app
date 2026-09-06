import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
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

import { GOONG_MAP_API_KEY } from "@/lib/env";
import { useMemoriesMapQuery } from "@/lib/query/hooks";
import type { MapBounds } from "@/types/api";
import { BrandColors } from "@/constants/theme";
import { PolaroidMapMarker } from "@/features/map/components/polaroid-map-marker";
import { useMapFocusStore } from "@/features/map/store/map-focus-store";

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

function SuccessToast({ visible }: { visible: boolean }) {
  const translateY = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: -80,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  return (
    <Animated.View style={[styles.toast, { transform: [{ translateY }] }]}>
      <Text style={styles.toastText}>📍 Memory pinned!</Text>
    </Animated.View>
  );
}

export function MemoriesMapScreen() {
  const cameraRef = useRef<CameraRef>(null);
  const pendingFocus = useMapFocusStore((s) => s.pendingFocus);
  const setPendingFocus = useMapFocusStore((s) => s.setPendingFocus);
  const showSuccessToast = useMapFocusStore((s) => s.showSuccessToast);
  const setShowSuccessToast = useMapFocusStore((s) => s.setShowSuccessToast);

  const [debouncedBounds, setDebouncedBounds] = useState<MapBounds | null>(
    DEFAULT_BOUNDS,
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Zoom to a newly created pin once this tab is focused and the map is ready.
  useFocusEffect(
    useCallback(() => {
      if (!pendingFocus) return;

      const timer = setTimeout(() => {
        cameraRef.current?.flyTo({
          center: [pendingFocus.longitude, pendingFocus.latitude],
          zoom: 15,
          duration: 600,
        });
        setPendingFocus(null);
      }, 350);

      return () => clearTimeout(timer);
    }, [pendingFocus, setPendingFocus]),
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

  const { data, isLoading, isError } = useMemoriesMapQuery(debouncedBounds);
  const pins = data?.pins ?? [];

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
      <Map
        style={styles.map}
        mapStyle={GOONG_STYLE_URL}
        onRegionDidChange={onRegionDidChange}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM }}
        />
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

      <SafeAreaView style={styles.overlay} edges={["top"]} pointerEvents="none">
        <SuccessToast visible={showSuccessToast} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {isLoading ? "Loading pins…" : `${pins.length} memories`}
            {isError ? " · could not load" : ""}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  map: { flex: 1 },
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
    color: BrandColors.white,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  badge: {
    margin: 16,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  badgeText: { fontSize: 14, fontWeight: "600", color: BrandColors.gray800 },
  webFallback: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    gap: 12,
  },
  webTitle: { fontSize: 20, fontWeight: "700", color: BrandColors.gray900 },
  webBody: { fontSize: 15, color: BrandColors.gray600, lineHeight: 22 },
});
