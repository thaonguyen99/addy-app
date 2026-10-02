import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useTourPersistence,
  type TourStep,
} from "@wrack/react-native-tour-guide";
import { router } from "expo-router";
import { useEffect, useMemo, useRef } from "react";

import { useAuthStore } from "@/features/auth/store/auth-store";
import { renderClippedTooltip } from "@/features/onboarding/components/clipped-tooltip";
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
  const { nextStep, pauseTour, startTour } = tour;
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
        hideNextButton: true,
        onSpotlightPress: () => {
          pauseTour();
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
        // "Tap anywhere" — the backdrop advances too, not just the spotlight.
        backdropBehavior: "next",
        onSpotlightPress: () => nextStep(),
      },
      {
        id: ONBOARDING_ADD_FRIEND_STEP_ID,
        targetId: ONBOARDING_ADD_FRIEND_TARGET_ID,
        title: "Add a friend",
        description: "See their memories on your map, and share yours.",
        // Tapping the highlighted Friends button finishes the tour (firing
        // onTourEnd) and opens it, instead of being swallowed by the overlay.
        onSpotlightPress: () => {
          nextStep();
          router.push("/(app)/friends");
        },
        before: async () => {
          if (router.canGoBack()) router.back();
          router.replace("/(app)/(tabs)");
          await new Promise((resolve) => setTimeout(resolve, 250));
        },
      },
    ],
    [nextStep, pauseTour],
  );

  useEffect(() => {
    if (status !== "authenticated") return;
    if (!needsOnboarding(user)) return;
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    useOnboardingCaptureStore.getState().setActive(true);
    // `force` (3rd arg): the server's onboardingCompletedAt (needsOnboarding
    // above) decides who sees the tour. Without it, the library's own
    // per-device "completed" flag would hide the tour from every later
    // account on this phone once any account finished it.
    void startTour(
      steps,
      {
        ...onboardingTourTheme,
        tourId: ONBOARDING_TOUR_ID,
        // A Modal overlay dismissed mid-navigation (every step here navigates)
        // can leave an invisible native layer that blocks all touches; an
        // inline layer at the app root unmounts cleanly.
        overlayMode: "inline",
        // Keeps "top" tooltips from covering (and eating taps on) the spotlight.
        renderTooltip: renderClippedTooltip,
        doneButtonText: "Got it",
        onTourEnd: () => {
          useOnboardingCaptureStore.getState().setActive(false);
          completeOnboarding.mutate();
        },
      },
      true,
    );
  }, [status, user, steps, startTour, completeOnboarding]);
}
