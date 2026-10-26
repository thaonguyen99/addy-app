import * as Updates from "expo-updates";
import { useEffect } from "react";
import { AppState } from "react-native";

/** Don't hit the update server on every quick app switch. */
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

let lastCheckAt = 0;

async function downloadNewUpdate(): Promise<void> {
  if (Date.now() - lastCheckAt < CHECK_INTERVAL_MS) return;
  lastCheckAt = Date.now();
  try {
    const { isAvailable } = await Updates.checkForUpdateAsync();
    if (isAvailable) await Updates.fetchUpdateAsync();
  } catch (error) {
    // Offline or the update server is down; the next foreground tries again.
    console.warn("[updates] check failed", error);
  }
}

/**
 * Keeps the JS bundle fresh while the app stays open: checks on launch and
 * whenever the app comes back to the foreground. A downloaded update waits
 * for the user to restart; `isUpdatePending` tells the banner when to show.
 */
export function useOtaUpdate(): { isUpdatePending: boolean } {
  const { isUpdatePending } = Updates.useUpdates();

  useEffect(() => {
    // Dev builds and Expo Go run without EAS Update.
    if (!Updates.isEnabled) return;
    void downloadNewUpdate();
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") void downloadNewUpdate();
    });
    return () => sub.remove();
  }, []);

  return { isUpdatePending };
}

export function restartIntoUpdate(): void {
  Updates.reloadAsync().catch((error) => {
    console.warn("[updates] reload failed", error);
  });
}
