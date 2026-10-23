import * as Clipboard from "expo-clipboard";
import { Linking, Platform, Share } from "react-native";

import { showToast } from "@/features/toast/toast-store";

export function inviteMessage(link: string): string {
  return `Come pin memories with me on Addy: ${link}`;
}

export async function copyInviteLink(link: string): Promise<void> {
  if (!link) return;
  await Clipboard.setStringAsync(link);
  showToast("Copied");
}

/** The system share sheet — also the fallback for every app target. */
export function shareInviteLink(link: string): void {
  if (!link) return;
  void Share.share({ message: inviteMessage(link) });
}

export function shareInviteViaSms(link: string): void {
  if (!link) return;
  // iOS separates the body with "&", Android with "?".
  const separator = Platform.OS === "ios" ? "&" : "?";
  Linking.openURL(
    `sms:${separator}body=${encodeURIComponent(inviteMessage(link))}`,
  ).catch(() => shareInviteLink(link));
}

/** Opens Messenger's share composer; the share sheet if it isn't installed. */
export function shareInviteViaMessenger(link: string): void {
  if (!link) return;
  Linking.openURL(
    `fb-messenger://share/?link=${encodeURIComponent(link)}`,
  ).catch(() => shareInviteLink(link));
}

/** Zalo has no public share URL scheme, so it goes through the share sheet. */
export function shareInviteViaZalo(link: string): void {
  shareInviteLink(link);
}
