import { router } from "expo-router";

import { useMapFocusStore } from "@/features/map/store/map-focus-store";

/**
 * After a pin is saved: stash the map focus coords, close the whole create flow
 * (create-pin + place-selection + photo-selection all live on the root (app)
 * stack, so one dismissAll clears them), then land on the explore/map tab.
 */
export function navigateAfterCreatePin(
  _memoryId: string,
  latitude: number,
  longitude: number,
) {
  useMapFocusStore.getState().setPendingFocus({ latitude, longitude });
  useMapFocusStore.getState().setShowSuccessToast(true);

  if (router.canDismiss()) {
    router.dismissAll();
  }

  router.replace("/(app)/(tabs)/explore");
}
