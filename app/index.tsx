import { Redirect } from "expo-router";

import { useAuthStore } from "@/features/auth/store/auth-store";

export default function Index() {
  const status = useAuthStore((s) => s.status);

  if (status === "hydrating" || status === "idle") {
    return null;
  }

  if (status === "authenticated") {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/sign-in" />;
}
