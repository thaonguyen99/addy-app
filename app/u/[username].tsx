import { Redirect, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";

import { setPendingLink } from "@/features/friends/pending-link";
import { isOwnUsername } from "@/features/profile/open-profile";
import { useAuthStore } from "@/stores/auth.store";

/**
 * Shared profile link: https://addy.app/u/<username> (or addyapp://u/<username>).
 * Signed out, it waits in SecureStore like an invite and opens after sign-in.
 */
export default function ProfileLinkRoute() {
  const { username } = useLocalSearchParams<{ username?: string }>();
  const name = typeof username === "string" ? username : "";
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status === "unauthenticated" && name) {
      void setPendingLink({ kind: "profile", username: name });
    }
  }, [status, name]);

  if (status === "unauthenticated") return <Redirect href="/sign-in" />;
  if (status !== "authenticated") return null;
  if (!name || isOwnUsername(name)) return <Redirect href="/(app)/(tabs)" />;
  return (
    <Redirect href={{ pathname: "/user/[username]", params: { username: name } }} />
  );
}
