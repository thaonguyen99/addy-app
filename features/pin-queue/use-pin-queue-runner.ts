import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";
import { AppState } from "react-native";

import { useAuthStore } from "@/features/auth/store/auth-store";
import { usePinQueueStore } from "@/features/pin-queue/pin-queue-store";
import { processPinQueue } from "@/features/pin-queue/process-pin-queue";

/**
 * Mounted once in the signed-in layout. Loads the current user's queue (and
 * unloads it on sign-out / account switch), then drains it on start, when the
 * connection comes back, and when the app returns to the foreground.
 */
export function usePinQueueRunner() {
  const userId = useAuthStore((s) => s.user?.id ?? null);

  useEffect(() => {
    let cancelled = false;
    void usePinQueueStore
      .getState()
      .hydrate(userId)
      .then(() => {
        if (!cancelled && userId) void processPinQueue({ ignoreBackoff: true });
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    let wasConnected: boolean | null = null;
    const unsubscribeNet = NetInfo.addEventListener((state) => {
      const connected = state.isConnected !== false;
      if (connected && wasConnected === false) {
        void processPinQueue({ ignoreBackoff: true });
      }
      wasConnected = connected;
    });

    const appStateSub = AppState.addEventListener("change", (next) => {
      if (next === "active") void processPinQueue({ ignoreBackoff: true });
    });

    return () => {
      unsubscribeNet();
      appStateSub.remove();
    };
  }, [userId]);
}
