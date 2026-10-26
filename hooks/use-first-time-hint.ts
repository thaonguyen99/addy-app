import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

/**
 * A one-time hint: visible until `dismiss` is called (e.g. once the user does
 * the thing it teaches), then never again on this device.
 */
export function useFirstTimeHint(key: string): {
  visible: boolean;
  dismiss: () => void;
} {
  const storageKey = `addy.hint.${key}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(storageKey)
      .then((seen) => {
        if (!cancelled && !seen) setVisible(true);
      })
      .catch(() => {
        // Storage unavailable — just skip the hint.
      });
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  const dismiss = useCallback(() => {
    setVisible((wasVisible) => {
      if (wasVisible) void AsyncStorage.setItem(storageKey, "1").catch(() => {});
      return false;
    });
  }, [storageKey]);

  return { visible, dismiss };
}
