import { navigateAfterCreatePin } from "@/features/create-pin/navigate-after-create-pin";
import { useOnboardingCaptureStore } from "@/features/onboarding/store/onboarding-capture-store";

type OnboardingTourHandle = {
  resumeTour: () => void;
};

/**
 * Called instead of navigateAfterCreatePin when a pin is saved while the
 * onboarding tour is active. Resumes the tour (undoing the pause set when the
 * camera screen gained focus) and gives the same map-first payoff as normal
 * capture. The tour itself advances to the "map + pin" step later, once the
 * map screen has settled and the pin's highlight target is positioned (see
 * memories-map-screen.tsx) — not here, since that target isn't ready yet.
 */
export function handleOnboardingPinSaved(
  memory: { id: string; place: { latitude: number; longitude: number } },
  tour: OnboardingTourHandle,
) {
  useOnboardingCaptureStore.getState().setActive(false);
  useOnboardingCaptureStore.getState().setLastCreatedMemoryId(memory.id);
  tour.resumeTour();
  navigateAfterCreatePin(
    memory.id,
    memory.place.latitude,
    memory.place.longitude,
  );
}
