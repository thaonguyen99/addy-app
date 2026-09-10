import { Redirect, Stack } from "expo-router";

import { CameraSessionProvider } from "@/features/camera/context/camera-session-context";
import { useAuthStore } from "@/features/auth/store/auth-store";

export default function AppLayout() {
  const status = useAuthStore((s) => s.status);

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
      </Stack>
    </CameraSessionProvider>
  );
}
