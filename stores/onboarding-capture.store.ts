import { create } from "zustand";

type OnboardingCaptureState = {
  active: boolean;
  setActive: (active: boolean) => void;
  /** The pin saved during onboarding — read by the tour's "map + pin" step
   *  to know which memory to open when the highlighted pin is tapped. */
  lastCreatedMemoryId: string | null;
  setLastCreatedMemoryId: (id: string | null) => void;
  /** Set once the camera preview is live, so the tour's first step has a
   *  shutter to spotlight (new users first see the permission prompt). */
  cameraReady: boolean;
  setCameraReady: (ready: boolean) => void;
  /** Bumped when the tour's shutter spotlight is tapped; the camera view
   *  takes a photo on each change, since the tap never reaches the shutter. */
  captureRequestId: number;
  requestCapture: () => void;
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
    lastCreatedMemoryId: null,
    setLastCreatedMemoryId: (id) => set({ lastCreatedMemoryId: id }),
    cameraReady: false,
    setCameraReady: (ready) => set({ cameraReady: ready }),
    captureRequestId: 0,
    requestCapture: () =>
      set((s) => ({ captureRequestId: s.captureRequestId + 1 })),
  }),
);
