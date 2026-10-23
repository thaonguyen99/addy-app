import { Redirect, router } from "expo-router";
import { useEffect } from "react";

import { useAuthStore } from "@/features/auth/store/auth-store";
import { setPendingInviteToken } from "@/features/friends/pending-invite";
import { openInvite } from "@/features/friends/store/friend-sheets-store";

/**
 * Landing route for invite links (`https://addy.app/i/<token>` and
 * `addyapp://add-friend?token=`). It opens the Add sheet over whatever was
 * on screen and gets out of the way. Signed out, the token waits in
 * SecureStore and the sheet opens after sign-in.
 */
export function InviteLinkRoute({ token }: { token: string | undefined }) {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status === "unauthenticated" && token) {
      void setPendingInviteToken(token);
    }
    if (status !== "authenticated") return;
    if (token) openInvite(token);
    if (router.canGoBack()) router.back();
    else router.replace("/(app)/(tabs)/friends");
  }, [status, token]);

  if (status === "unauthenticated") return <Redirect href="/sign-in" />;
  return null;
}
