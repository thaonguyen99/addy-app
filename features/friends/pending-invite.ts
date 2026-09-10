import * as SecureStore from "expo-secure-store";

const KEY = "addy.pendingInviteToken";

/**
 * A friend-invite deep link (addyapp://add-friend?token=...) can arrive while
 * the app is signed out. We stash the token here and resume the confirm-add
 * flow once the user authenticates.
 */
export async function setPendingInviteToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, token);
  } catch {
    // non-critical
  }
}

export async function takePendingInviteToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(KEY);
    if (token) await SecureStore.deleteItemAsync(KEY);
    return token;
  } catch {
    return null;
  }
}
