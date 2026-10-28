import {
  AccessToken,
  AuthenticationToken,
  LoginManager,
  Settings,
} from "react-native-fbsdk-next";
import { Platform } from "react-native";

import { FACEBOOK_APP_ID } from "@/lib/env";
import { ApiClientError } from "../api/errors";
import type { FacebookSignInInput } from "./auth.type";

const PERMISSIONS = ["public_profile", "email"];

let initialized = false;

function initializeFacebookSdk() {
  if (initialized) return;
  Settings.initializeSDK();
  initialized = true;
}

/** Best-effort: drop the native Facebook session so the next sign-in re-prompts. */
export async function signOutFacebook(): Promise<void> {
  if (Platform.OS === "web" || !FACEBOOK_APP_ID) return;
  try {
    LoginManager.logOut();
  } catch {
    // ignore — nothing to sign out of, or the module isn't ready
  }
}

/**
 * Runs the native Facebook login and returns the token the API expects.
 * iOS uses Limited Login, which needs no App Tracking Transparency prompt and
 * yields an OIDC token; Android uses classic login and yields an access token.
 */
export async function getFacebookSignInToken(): Promise<FacebookSignInInput> {
  if (Platform.OS === "web") {
    throw new ApiClientError(
      "Facebook Sign-In requires a native dev build",
      "BAD_REQUEST",
    );
  }

  if (!FACEBOOK_APP_ID) {
    throw new ApiClientError(
      "Facebook Sign-In is missing the app ID. Rebuild the app after setting FACEBOOK_APP_ID.",
      "INTERNAL_ERROR",
    );
  }

  initializeFacebookSdk();

  const result =
    Platform.OS === "ios"
      ? await LoginManager.logInWithPermissions(PERMISSIONS, "limited")
      : await LoginManager.logInWithPermissions(PERMISSIONS);

  if (result.isCancelled) {
    throw new ApiClientError(
      "Facebook Sign-In was cancelled",
      "SIGN_IN_CANCELLED",
    );
  }

  if (Platform.OS === "ios") {
    const token = await AuthenticationToken.getAuthenticationTokenIOS();
    if (!token?.authenticationToken) {
      throw new ApiClientError(
        "Facebook did not return an authentication token",
        "INTERNAL_ERROR",
      );
    }
    return { authenticationToken: token.authenticationToken };
  }

  const token = await AccessToken.getCurrentAccessToken();
  if (!token?.accessToken) {
    throw new ApiClientError(
      "Facebook did not return an access token",
      "INTERNAL_ERROR",
    );
  }
  return { accessToken: token.accessToken };
}
