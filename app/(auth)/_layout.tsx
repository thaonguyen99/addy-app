import { Redirect, Stack } from "expo-router";

import { useAuthStore } from "@/features/auth/store/auth-store";

export default function AuthLayout() {
  const status = useAuthStore((s) => s.status);

  if (status === "authenticated") {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}

