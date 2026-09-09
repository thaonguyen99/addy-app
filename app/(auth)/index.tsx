import { Redirect } from "expo-router";

import { useAuthStore } from "@/features/auth/store/auth-store";

export default function AuthIndex() {
  const status = useAuthStore((s) => s.status);
  const pendingEmail = useAuthStore((s) => s.pendingEmail);
  const pendingOtpPurpose = useAuthStore((s) => s.pendingOtpPurpose);

  if (status === "authenticated") {
    return <Redirect href="/(app)/(tabs)" />;
  }

  if (pendingEmail && pendingOtpPurpose === "register") {
    return <Redirect href="/verify-otp" />;
  }

  return <Redirect href="/sign-in" />;
}
