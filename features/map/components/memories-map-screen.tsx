import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useMemoriesMapQuery } from "@/lib/query/hooks";
import type { MapBounds } from "@/types/api";
import { BrandColors } from "@/constants/theme";
import { PolaroidMapMarker } from "@/features/map/components/polaroid-map-marker";
import { useMapFocusStore } from "@/features/map/store/map-focus-store";

const DEFAULT_REGION: Region = {
  latitude: 10.762622,
  longitude: 106.660172,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const TOAST_VISIBLE_MS = 3000;

function regionToBounds(region: Region): MapBounds {
  const latHalf = region.latitudeDelta / 2;
  const lngHalf = region.longitudeDelta / 2;
  return {
    north: region.latitude + latHalf,
    south: region.latitude - latHalf,
    east: region.longitude + lngHalf,
    west: region.longitude - lngHalf,
    limit: 50,
  };
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
  const mapRef = useRef<MapView>(null);
  const pendingFocus = useMapFocusStore((s) => s.pendingFocus);
  const setPendingFocus = useMapFocusStore((s) => s.setPendingFocus);
  const showSuccessToast = useMapFocusStore((s) => s.showSuccessToast);
  const setShowSuccessToast = useMapFocusStore((s) => s.setShowSuccessToast);

  const [region, setRegion] = useState<Region>(DEFAULT_REGION);
  const [debouncedBounds, setDebouncedBounds] = useState<MapBounds | null>(() =>
    regionToBounds(DEFAULT_REGION),
  );

  const debounceRef = useMemo(
    () => ({ timer: null as ReturnType<typeof setTimeout> | null }),
    [],
  );

  // Zoom to a newly created pin once this tab is focused and the map is ready.
  useFocusEffect(
    useCallback(() => {
      if (!pendingFocus) return;

      const timer = setTimeout(() => {
        mapRef.current?.animateToRegion(
          {
            latitude: pendingFocus.latitude,
            longitude: pendingFocus.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          600,
        );
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

  const onRegionChangeComplete = useCallback(
    (next: Region) => {
      setRegion(next);
      if (debounceRef.timer) clearTimeout(debounceRef.timer);
      debounceRef.timer = setTimeout(() => {
        setDebouncedBounds(regionToBounds(next));
      }, 400);
    },
    [debounceRef],
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
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            onPress={() => router.push(`/memory/${pin.id}`)}
            tracksViewChanges={false}
            anchor={{ x: 0.5, y: 1 }}
          >
            <PolaroidMapMarker imageUrl={pin.imageUrl} />
          </Marker>
        ))}
      </MapView>

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
