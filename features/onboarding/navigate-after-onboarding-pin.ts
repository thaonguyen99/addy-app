import { navigateAfterCreatePin } from "@/features/create-pin/navigate-after-create-pin";
import { useOnboardingCaptureStore } from "@/features/onboarding/store/onboarding-capture-store";

/**
 * Called instead of navigateAfterCreatePin when a pin is saved while the
 * onboarding tour is active: gives the same map-first payoff as normal
 * capture. The tour stays paused here — the map screen resumes it and
 * advances to the "map + pin" step once the create-flow modals are gone and
 * the camera has settled (see memories-map-screen.tsx). Resuming now, while a
 * page-sheet modal still shrinks the screen behind it, would make the overlay
 * measure its origin off by the card offset for the rest of the tour.
 */
export function handleOnboardingPinSaved(
  /** Null when the pin is still queued (offline) — the tour then skips opening it. */
  memoryId: string | null,
  coords: { latitude: number; longitude: number },
) {
  useOnboardingCaptureStore.getState().setActive(false);
  useOnboardingCaptureStore.getState().setLastCreatedMemoryId(memoryId);
  navigateAfterCreatePin(coords.latitude, coords.longitude);
}
