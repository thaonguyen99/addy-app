import { useState } from "react";
import { Alert, Platform } from "react-native";

import { AuthPrimaryButton } from "@/features/auth/components/auth-primary-button";
import { getGoogleIdToken } from "@/features/auth/google/google-sign-in";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { ApiClientError } from "@/lib/api/errors";
import { useGoogleSignInMutation } from "@/lib/query/hooks";

export function GoogleSignInButton() {
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const googleMutation = useGoogleSignInMutation();

  const onPress = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Google Sign-In",
        "Use a development build on iOS or Android for Google Sign-In."
      );
      return;
    }

    setLoading(true);
    try {
      const idToken = await getGoogleIdToken();
      const session = await googleMutation.mutateAsync({ idToken });
      await setSession(session);
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "BAD_REQUEST") {
        return;
      }
      const message =
        error instanceof ApiClientError
          ? error.message
          : "Could not sign in with Google";
      Alert.alert("Google Sign-In", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPrimaryButton
      label="Continue with Google"
      variant="secondary"
      loading={loading}
      onPress={onPress}
    />
  );
}
