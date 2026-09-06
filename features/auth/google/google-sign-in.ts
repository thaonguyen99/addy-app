import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";

import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "@/lib/env";
import { ApiClientError } from "@/lib/api/errors";

let configured = false;

export function configureGoogleSignIn() {
  if (configured || Platform.OS === "web") return;
  GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
    offlineAccess: false,
  });
  configured = true;
}

export async function getGoogleIdToken(): Promise<string> {
  configureGoogleSignIn();

  if (Platform.OS === "web") {
    throw new ApiClientError(
      "Google Sign-In requires a native dev build",
      "BAD_REQUEST"
    );
  }

  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new ApiClientError(
      "Google Sign-In is missing the Web client ID. Rebuild the app after setting GOOGLE_OAUTH_CLIENT_IDS.",
      "INTERNAL_ERROR"
    );
  }

  try {
    if (Platform.OS === "android") {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }

    const result = await GoogleSignin.signIn();
    if (result.type === "cancelled") {
      throw new ApiClientError("Google Sign-In was cancelled", "SIGN_IN_CANCELLED");
    }

    let idToken = result.data?.idToken ?? null;
    if (!idToken) {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens.idToken;
    }

    if (!idToken) {
      throw new ApiClientError(
        "Google did not return an ID token. Confirm the Web OAuth client ID is set and rebuild the app.",
        "INTERNAL_ERROR"
      );
    }

    return idToken;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new ApiClientError("Google Sign-In was cancelled", "SIGN_IN_CANCELLED");
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        throw new ApiClientError("Sign-in already in progress", "BAD_REQUEST");
      }
    }
    throw error;
  }
}
