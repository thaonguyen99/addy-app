import { useState } from "react";
import { Alert, Platform } from "react-native";
import { router } from "expo-router";

import { AuthPrimaryButton } from "@/features/auth/components/auth-primary-button";
import { getFacebookSignInToken, useFacebookSignInMutation } from "@/services/auth";
import { getAuthErrorMessage } from "@/hooks/use-auth-form-error";
import { useAuthStore } from "@/stores/auth.store";
import { warmUpApi } from "@/services/api/client";
import { ApiClientError } from "@/services/api/errors";

export function FacebookSignInButton() {
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const facebookMutation = useFacebookSignInMutation();

  const onPress = async () => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Facebook Sign-In",
        "Use a development build on iOS or Android for Facebook Sign-In."
      );
      return;
    }

    // Nudge the cold-starting API while the user is in the Facebook login sheet.
    warmUpApi();
    setLoading(true);
    try {
      const input = await getFacebookSignInToken();
      const session = await facebookMutation.mutateAsync(input);
      await setSession(session);
      router.replace("/capture");
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "SIGN_IN_CANCELLED") {
        return;
      }
      console.error("[Facebook Sign-In]", error);
      Alert.alert(
        "Facebook Sign-In",
        getAuthErrorMessage(error, "Could not sign in with Facebook")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPrimaryButton
      label="Continue with Facebook"
      variant="secondary"
      loading={loading}
      onPress={onPress}
    />
  );
}
