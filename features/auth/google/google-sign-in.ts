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

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    const idToken = result.data?.idToken;
    if (!idToken) {
      throw new ApiClientError("Google Sign-In was cancelled", "BAD_REQUEST");
    }
    return idToken;
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        throw new ApiClientError("Google Sign-In was cancelled", "BAD_REQUEST");
      }
      if (error.code === statusCodes.IN_PROGRESS) {
        throw new ApiClientError("Sign-in already in progress", "BAD_REQUEST");
      }
    }
    throw error;
  }
}
