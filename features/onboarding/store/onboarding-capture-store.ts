import { create } from "zustand";

type OnboardingCaptureState = {
  active: boolean;
  setActive: (active: boolean) => void;
};

/**
 * Transient flag read by useCreatePinSubmit to decide whether a saved pin
 * should resume the onboarding tour instead of the normal fly-to-map
 * behavior. Doesn't need to survive a force-quit — if the app is killed
 * mid-tour, onboarding just restarts from step 1 on next launch (see
 * onboarding-tour.ts), driven by the server-side onboardingCompletedAt flag.
 */
export const useOnboardingCaptureStore = create<OnboardingCaptureState>(
  (set) => ({
    active: false,
    setActive: (active) => set({ active }),
  }),
);
