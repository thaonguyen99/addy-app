import { router } from "expo-router";

import { useMapFocusStore } from "@/features/map/store/map-focus-store";

/**
 * After a pin is saved: stash map focus coords, then dismiss every modal/stack
 * screen until we land on the explore tab. dismissTo replaces the route if
 * explore is not already in history (e.g. coming from the create-pin modal).
 */
export function navigateAfterCreatePin(
  _memoryId: string,
  latitude: number,
  longitude: number,
) {
  useMapFocusStore.getState().setPendingFocus({ latitude, longitude });
  useMapFocusStore.getState().setShowSuccessToast(true);

  router.dismissTo("/(app)/(tabs)/explore");
}
