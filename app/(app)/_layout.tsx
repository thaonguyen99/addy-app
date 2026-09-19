import { Redirect, router, Stack } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

import { CameraSessionProvider } from "@/features/camera/context/camera-session-context";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { takePendingInviteToken } from "@/features/friends/pending-invite";
import { AddMemoryTourTarget } from "@/features/onboarding/components/add-memory-tour-target";
import { useOnboardingTour } from "@/features/onboarding/onboarding-tour";
import { registerForPush } from "@/features/notifications/push-registration";

export default function AppLayout() {
  const status = useAuthStore((s) => s.status);

  useOnboardingTour();

  useEffect(() => {
    if (status !== "authenticated") return;
    void registerForPush();
    // Resume a friend-invite deep link that arrived while signed out.
    void takePendingInviteToken().then((token) => {
      if (token) {
        router.push({ pathname: "/add-friend", params: { token } });
      }
    });
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
            name="photo-selection"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
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
          <Stack.Screen name="memory/[id]" />
          <Stack.Screen name="profile/index" />
          <Stack.Screen name="profile/account" />
          <Stack.Screen name="profile/security" />
          <Stack.Screen name="profile/notifications" />
          <Stack.Screen name="privacy-policy" />
          <Stack.Screen name="friends/index" />
          <Stack.Screen name="friends/add" />
          <Stack.Screen name="friends/scan" />
          <Stack.Screen name="blocked-accounts" />
        </Stack>
        {/* Independently-positioned spotlight target for the onboarding
            tour's first step — see AddMemoryTourTarget for why this isn't
            wrapped around the tab bar's own camera button. */}
        <AddMemoryTourTarget />
      </View>
    </CameraSessionProvider>
  );
}
