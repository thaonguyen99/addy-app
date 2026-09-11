import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useTourPersistence,
  type TourStep,
} from "@wrack/react-native-tour-guide";
import { router } from "expo-router";
import { useEffect, useMemo, useRef } from "react";

import { useAuthStore } from "@/features/auth/store/auth-store";
import { needsOnboarding } from "@/features/onboarding/needs-onboarding";
import { onboardingTourTheme } from "@/features/onboarding/onboarding-theme";
import { useOnboardingCaptureStore } from "@/features/onboarding/store/onboarding-capture-store";
import { useCompleteOnboardingMutation } from "@/lib/query/hooks";

export const ONBOARDING_TOUR_ID = "onboarding-v1";

// Step ids (also doubling as TourTarget ids where a step targets exactly one
// always-mounted element, e.g. the tab icon).
export const ONBOARDING_ADD_MEMORY_STEP_ID = "onboarding-add-memory";
export const ONBOARDING_MAP_PIN_STEP_ID = "onboarding-map-pin";
export const ONBOARDING_MEMORY_DETAIL_STEP_ID = "onboarding-memory-detail";
export const ONBOARDING_ADD_FRIEND_STEP_ID = "onboarding-add-friend";

// TourTarget ids for targets that aren't simply "the step id" (a dedicated
// invisible highlight view for the map pin, and the memory-detail/add-friend
// elements on screens the step id doesn't otherwise name).
export const ONBOARDING_MAP_PIN_TARGET_ID = "onboarding-map-pin-target";
export const ONBOARDING_MEMORY_DETAIL_TARGET_ID =
  "onboarding-memory-detail-target";
export const ONBOARDING_ADD_FRIEND_TARGET_ID = "onboarding-add-friend-target";

/**
 * Guides a first-time user through creating one real pin, seeing it on the
 * map, opening it, and getting pointed at Add Friend — as spotlights over the
 * real app screens rather than a separate onboarding route. Mounted from
 * app/(app)/_layout.tsx once the user is authenticated.
 */
export function useOnboardingTour() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const completeOnboarding = useCompleteOnboardingMutation();
  const tour = useTourPersistence(AsyncStorage);
  const { nextStep, startTour } = tour;
  const hasStartedRef = useRef(false);

  const steps = useMemo<TourStep[]>(
    () => [
      {
        id: ONBOARDING_ADD_MEMORY_STEP_ID,
        targetId: ONBOARDING_ADD_MEMORY_STEP_ID,
        title: "Add your first memory",
        description: "Tap here to snap a photo and pin it to a place.",
        tooltipPosition: "top",
        hidePrevButton: true,
        // Progression happens once a pin is actually saved (see
        // navigate-after-onboarding-pin.ts + memories-map-screen.tsx), not
        // via a Next tap — hide it so it can't skip ahead of a real pin.
        hideNextButton: true,
        // A custom tabBarButton wrapped in TourTarget isn't a reliable
        // interactive touch-passthrough target (react-navigation's own
        // button-slot layout gets in the way of the overlay's press-bands),
        // so navigate from onSpotlightPress instead — a plain Pressable the
        // overlay renders over the spotlight itself, unrelated to whether
        // the real tab button underneath ever receives the touch. This also
        // doesn't call nextStep(), so it can't skip ahead to step 2 early.
        onSpotlightPress: () => {
          console.log("onSpotlightPress");
          router.push("/(app)/(tabs)/camera");
        },
      },
      {
        id: ONBOARDING_MAP_PIN_STEP_ID,
        targetId: ONBOARDING_MAP_PIN_TARGET_ID,
        title: "There it is",
        description: "Tap your new pin to see the memory you just created.",
        hidePrevButton: true,
        hideNextButton: true,
        autoAdvance: 0,
        // Same reasoning as step 1: don't rely on a real tap reaching the
        // MapLibre marker underneath the overlay. onSpotlightPress renders
        // its own reliable Pressable over the highlighted area instead.
        onSpotlightPress: () => {
          const memoryId =
            useOnboardingCaptureStore.getState().lastCreatedMemoryId;
          if (memoryId) router.push(`/memory/${memoryId}`);
          nextStep();
        },
      },
      {
        id: ONBOARDING_MEMORY_DETAIL_STEP_ID,
        targetId: ONBOARDING_MEMORY_DETAIL_TARGET_ID,
        title: "You mapped a real place",
        description: "Tap anywhere to continue.",
        hideNextButton: true,
        hidePrevButton: true,
        onSpotlightPress: () => nextStep(),
      },
      {
        id: ONBOARDING_ADD_FRIEND_STEP_ID,
        targetId: ONBOARDING_ADD_FRIEND_TARGET_ID,
        title: "Add a friend",
        description: "See their memories on your map, and share yours.",
        before: async () => {
          if (router.canGoBack()) router.back();
          router.replace("/(app)/(tabs)");
          await new Promise((resolve) => setTimeout(resolve, 250));
        },
      },
    ],
    [nextStep],
  );

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!needsOnboarding(user)) return;
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    useOnboardingCaptureStore.getState().setActive(true);
    void startTour(steps, {
      ...onboardingTourTheme,
      tourId: ONBOARDING_TOUR_ID,
      doneButtonText: "Got it",
      onTourEnd: () => {
        useOnboardingCaptureStore.getState().setActive(false);
        completeOnboarding.mutate();
      },
    });
  }, [status, user, steps, startTour, completeOnboarding]);
}
