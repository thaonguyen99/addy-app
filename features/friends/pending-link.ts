import * as SecureStore from "expo-secure-store";

// Key kept from when only invites were stashed, so a waiting one still opens.
const KEY = "addy.pendingInviteToken";

/** A deep link that arrived while signed out: an invite or a profile. */
export type PendingLink =
  | { kind: "invite"; token: string }
  | { kind: "profile"; username: string };

/**
 * An invite link (https://addy.app/i/<token>, addyapp://add-friend?token=) or a
 * profile link (https://addy.app/u/<username>) can arrive while the app is
 * signed out. We stash it here and open it once the user authenticates.
 */
export async function setPendingLink(link: PendingLink): Promise<void> {
  try {
    await SecureStore.setItemAsync(KEY, JSON.stringify(link));
  } catch {
    // non-critical
  }
}

export async function takePendingLink(): Promise<PendingLink | null> {
  try {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    await SecureStore.deleteItemAsync(KEY);
    return parse(raw);
  } catch {
    return null;
  }
}

function parse(raw: string): PendingLink | null {
  try {
    const link = JSON.parse(raw) as PendingLink;
    if (link.kind === "invite" && link.token) return link;
    if (link.kind === "profile" && link.username) return link;
    return null;
  } catch {
    // Stored by an older build: a bare invite token.
    return { kind: "invite", token: raw };
  }
}
