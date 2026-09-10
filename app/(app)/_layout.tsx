import { Redirect, router, Stack } from "expo-router";
import { useEffect } from "react";

import { CameraSessionProvider } from "@/features/camera/context/camera-session-context";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { takePendingInviteToken } from "@/features/friends/pending-invite";
import { registerForPush } from "@/features/notifications/push-registration";

export default function AppLayout() {
  const status = useAuthStore((s) => s.status);

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
        <Stack.Screen name="memory/[id]" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="friends/index" />
        <Stack.Screen name="friends/search" />
        <Stack.Screen name="friends/invite" />
        <Stack.Screen name="friends/scan" />
        <Stack.Screen name="blocked-accounts" />
      </Stack>
    </CameraSessionProvider>
  );
}
