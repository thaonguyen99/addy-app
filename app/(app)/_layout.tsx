import * as Notifications from "expo-notifications";
import { Redirect, Stack } from "expo-router";
import { useEffect } from "react";
import { AppState, View } from "react-native";

import { AddyColors } from "@/constants/theme";
import { CameraSessionProvider } from "@/features/camera/camera-session-context";
import { useAuthStore } from "@/stores/auth.store";
import { celebrateFromDeliveredPushes } from "@/features/friends/celebrated-friends";
import { FriendSheetsHost } from "@/features/friends/components/friend-sheets-host";
import { EditProfileSheet } from "@/features/profile/components/edit-profile-sheet";
import { takePendingLink } from "@/features/friends/pending-link";
import { openProfile } from "@/features/profile/open-profile";
import { openInvite } from "@/stores/friend-sheets.store";
import { useOnboardingTour } from "@/features/onboarding/onboarding-tour";
import { rescheduleOnThisDay } from "@/features/notifications/on-this-day-scheduler";
import { useRealtimeConnection } from "@/features/realtime/use-realtime-connection";
import { syncPushToken } from "@/services/notifications";
import { useInAppNotifications } from "@/hooks/use-in-app-notifications";
import { useNotificationRouter } from "@/hooks/use-notification-router";
import { usePinQueueRunner } from "@/hooks/use-pin-queue-runner";

// Deep links and the launch redirect to /capture keep the tabs underneath,
// so closing the camera lands on the map instead of an empty stack.
export const unstable_settings = { initialRouteName: "(tabs)" };

export default function AppLayout() {
  const status = useAuthStore((s) => s.status);

  useOnboardingTour();
  usePinQueueRunner();
  useInAppNotifications();
  useNotificationRouter(status === "authenticated");
  useRealtimeConnection();

  useEffect(() => {
    if (status !== "authenticated") return;
    // Never prompts: permission is asked after onboarding or a friend action.
    void syncPushToken();
    void rescheduleOnThisDay();
    void celebrateFromDeliveredPushes();
    // Resume an invite or profile deep link that arrived while signed out.
    void takePendingLink().then((link) => {
      if (link?.kind === "invite") openInvite(link.token);
      else if (link?.kind === "profile") openProfile(link.username);
    });

    const tokenSub = Notifications.addPushTokenListener(() => {
      void syncPushToken();
    });
    // A new day, or back from Settings with permission on.
    const appStateSub = AppState.addEventListener("change", (next) => {
      if (next === "active") void rescheduleOnThisDay();
    });
    return () => {
      tokenSub.remove();
      appStateSub.remove();
    };
  }, [status]);

  if (status === "hydrating" || status === "idle") {
    return null;
  }

  if (status !== "authenticated") {
    return <Redirect href="/sign-in" />;
  }

  return (
    <CameraSessionProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="capture"
            options={{
              animation: "slide_from_bottom",
              contentStyle: { backgroundColor: AddyColors.captureBg },
            }}
          />
          <Stack.Screen
            name="place-selection"
            options={{ presentation: "modal", animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="create-pin"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="memories"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="photo-picker"
            options={{
              presentation: "fullScreenModal",
              animation: "slide_from_bottom",
              contentStyle: { backgroundColor: AddyColors.captureBg },
            }}
          />
          <Stack.Screen name="memory/[id]" />
          <Stack.Screen name="user/[username]" />
          <Stack.Screen
            name="edit-memory/[id]"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="edit-memory/place"
            options={{ presentation: "modal", animation: "slide_from_right" }}
          />
          <Stack.Screen name="profile/index" />
          <Stack.Screen name="profile/security" />
          <Stack.Screen name="profile/notifications" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="privacy-policy" />
          <Stack.Screen name="blocked-accounts" />
          <Stack.Screen name="dev-primitives" />
        </Stack>
        <FriendSheetsHost />
        <EditProfileSheet />
      </View>
    </CameraSessionProvider>
  );
}
