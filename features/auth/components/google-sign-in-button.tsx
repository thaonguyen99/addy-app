import { useState } from "react";
import { Alert, Platform } from "react-native";
import { router } from "expo-router";

import { AuthPrimaryButton } from "@/features/auth/components/auth-primary-button";
import { getGoogleIdToken } from "@/features/auth/google/google-sign-in";
import { getAuthErrorMessage } from "@/features/auth/hooks/use-auth-form-error";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { warmUpApi } from "@/lib/api/client";
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

    // Nudge the cold-starting API while the user is in the Google account picker.
    warmUpApi();
    setLoading(true);
    try {
      const idToken = await getGoogleIdToken();
      const session = await googleMutation.mutateAsync({ idToken });
      await setSession(session);
      router.replace("/(app)/(tabs)");
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "SIGN_IN_CANCELLED") {
        return;
      }
      console.error("[Google Sign-In]", error);
      Alert.alert(
        "Google Sign-In",
        getAuthErrorMessage(error, "Could not sign in with Google")
      );
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
