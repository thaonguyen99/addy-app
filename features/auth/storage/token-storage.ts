import * as SecureStore from "expo-secure-store";

import type { AuthTokens, AuthUser } from "@/types/api";

const KEYS = {
  accessToken: "addy.accessToken",
  refreshToken: "addy.refreshToken",
  user: "addy.user",
  pendingEmail: "addy.pendingEmail",
} as const;

export async function loadStoredSession(): Promise<{
  user: AuthUser | null;
  tokens: AuthTokens | null;
}> {
  const [accessToken, refreshToken, userJson] = await Promise.all([
    SecureStore.getItemAsync(KEYS.accessToken),
    SecureStore.getItemAsync(KEYS.refreshToken),
    SecureStore.getItemAsync(KEYS.user),
  ]);

  if (!accessToken || !refreshToken || !userJson) {
    return { user: null, tokens: null };
  }

  try {
    const user = JSON.parse(userJson) as AuthUser;
    return { user, tokens: { accessToken, refreshToken } };
  } catch {
    return { user: null, tokens: null };
  }
}

export async function saveSession(user: AuthUser, tokens: AuthTokens) {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.accessToken, tokens.accessToken),
    SecureStore.setItemAsync(KEYS.refreshToken, tokens.refreshToken),
    SecureStore.setItemAsync(KEYS.user, JSON.stringify(user)),
  ]);
}

export async function saveTokens(tokens: AuthTokens) {
  await Promise.all([
    SecureStore.setItemAsync(KEYS.accessToken, tokens.accessToken),
    SecureStore.setItemAsync(KEYS.refreshToken, tokens.refreshToken),
  ]);
}

/** Wipe every auth key from secure storage. One failing delete never blocks the rest. */
export async function clearSession() {
  await Promise.allSettled(
    Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key)),
  );
}

export async function setPendingEmail(email: string) {
  await SecureStore.setItemAsync(KEYS.pendingEmail, email);
}

export async function getPendingEmail() {
  return SecureStore.getItemAsync(KEYS.pendingEmail);
}

export async function clearPendingEmail() {
  await SecureStore.deleteItemAsync(KEYS.pendingEmail);
}
