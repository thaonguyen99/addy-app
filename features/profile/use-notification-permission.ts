import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import { AppState, Linking } from "react-native";

import { registerForPush } from "@/services/notifications";

type PermissionState = { granted: boolean; canAskAgain: boolean } | null;

/**
 * The phone-level notification permission, re-read whenever the app comes
 * back to the foreground (e.g. after a trip to the Settings app).
 */
export function useNotificationPermission() {
  const [state, setState] = useState<PermissionState>(null);

  const refresh = useCallback(async () => {
    const current = await Notifications.getPermissionsAsync();
    setState({ granted: current.granted, canAskAgain: current.canAskAgain });
  }, []);

  useEffect(() => {
    void refresh();
    const sub = AppState.addEventListener("change", (next) => {
      if (next === "active") void refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  /** Ask in-app when the OS still allows it; otherwise open Settings. */
  const turnOn = useCallback(async () => {
    if (state?.canAskAgain) {
      const asked = await Notifications.requestPermissionsAsync();
      setState({ granted: asked.granted, canAskAgain: asked.canAskAgain });
      if (asked.granted) void registerForPush();
      return;
    }
    await Linking.openSettings();
  }, [state?.canAskAgain]);

  return { granted: state?.granted ?? true, ready: state !== null, turnOn };
}
