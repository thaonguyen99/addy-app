import { router } from "expo-router";

import { useAuthStore } from "@/stores/auth.store";

export function isOwnUsername(username: string): boolean {
  const mine = useAuthStore.getState().user?.username;
  return !!mine && mine.toLowerCase() === username.toLowerCase();
}

/**
 * Open someone's profile from a name or avatar anywhere in the app. Your own
 * username goes to the You tab instead of pushing a second copy of it.
 */
export function openProfile(username: string): void {
  if (!username) return;
  if (isOwnUsername(username)) {
    router.navigate("/(app)/(tabs)");
    return;
  }
  router.push({ pathname: "/user/[username]", params: { username } });
}
