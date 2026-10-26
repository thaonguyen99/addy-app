import { useEffect, useMemo, useRef, useState } from "react";

import { useCurrentLocation } from "@/hooks/use-current-location";
import { haversineDistanceMeters } from "@/utils/haversine-distance";
import { useFriendsMapQuery } from "@/services/memories";
import { useNotificationPreferencesQuery } from "@/services/notifications";
import type { FriendMemoryPin } from "@/services/memories";

/** How close a friend's pin needs to be to surface the nearby banner. */
const NEARBY_THRESHOLD_METERS = 300;
/** Query box half-width in degrees — comfortably covers the threshold above. */
const BOUNDS_DELTA = 0.01;

/**
 * One-shot check (not a polling timer): on mount, grabs the device location
 * once and looks for the nearest friend pin within `NEARBY_THRESHOLD_METERS`.
 * Off when Settings › Notifications › Friends nearby is off — then it doesn't
 * even ask for the location.
 */
export function useFriendPinNearby() {
  const { coords, refresh } = useCurrentLocation();
  const requestedRef = useRef(false);
  const [dismissed, setDismissed] = useState(false);
  const { data: prefs } = useNotificationPreferencesQuery();
  const enabled = prefs?.friendsNearby ?? false;

  useEffect(() => {
    if (!enabled || requestedRef.current) return;
    requestedRef.current = true;
    void refresh();
  }, [enabled, refresh]);

  const bounds = enabled && coords
    ? {
        north: coords.latitude + BOUNDS_DELTA,
        south: coords.latitude - BOUNDS_DELTA,
        east: coords.longitude + BOUNDS_DELTA,
        west: coords.longitude - BOUNDS_DELTA,
        limit: 50,
      }
    : null;

  const { data } = useFriendsMapQuery(bounds);

  const nearestPin: FriendMemoryPin | null = useMemo(() => {
    if (!coords || !data?.pins.length) return null;

    let nearest: FriendMemoryPin | null = null;
    let nearestDistance = Infinity;
    for (const pin of data.pins) {
      const distance = haversineDistanceMeters(coords, pin);
      if (distance <= NEARBY_THRESHOLD_METERS && distance < nearestDistance) {
        nearest = pin;
        nearestDistance = distance;
      }
    }
    return nearest;
  }, [coords, data]);

  return {
    pin: dismissed || !enabled ? null : nearestPin,
    dismiss: () => setDismissed(true),
  };
}
