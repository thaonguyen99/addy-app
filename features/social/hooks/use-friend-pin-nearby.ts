import { useEffect, useMemo, useRef, useState } from "react";

import { useCurrentLocation } from "@/features/location/hooks/use-current-location";
import { haversineDistanceMeters } from "@/features/social/utils/haversine-distance";
import { useFriendsMapQuery } from "@/lib/query/hooks";
import type { FriendMemoryPin } from "@/types/api";

/** How close a friend's pin needs to be to surface the nearby banner. */
const NEARBY_THRESHOLD_METERS = 300;
/** Query box half-width in degrees — comfortably covers the threshold above. */
const BOUNDS_DELTA = 0.01;

/**
 * One-shot check (not a polling timer): on mount, grabs the device location
 * once and looks for the nearest friend pin within `NEARBY_THRESHOLD_METERS`.
 */
export function useFriendPinNearby() {
  const { coords, refresh } = useCurrentLocation();
  const requestedRef = useRef(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    void refresh();
  }, [refresh]);

  const bounds = coords
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
    pin: dismissed ? null : nearestPin,
    dismiss: () => setDismissed(true),
  };
}
