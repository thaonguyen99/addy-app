import { useFocusEffect } from "@react-navigation/native";
import type { QueryClient, QueryKey } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

/** Query keys of the screens currently focused (normally just one). */
const focused = new Map<symbol, readonly QueryKey[]>();

/**
 * Register the queries this screen shows while it's focused, so coming back
 * from the background refreshes them, and not every mounted tab.
 */
export function useFocusedQueryKeys(keys: readonly QueryKey[]): void {
  const id = useRef(Symbol("focused-screen")).current;
  const keysRef = useRef(keys);
  keysRef.current = keys;
  const serialized = JSON.stringify(keys);

  useFocusEffect(
    useCallback(() => {
      focused.set(id, keysRef.current);
      return () => {
        focused.delete(id);
      };
      // Re-register when the keys change (e.g. the map moved).
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, serialized]),
  );
}

export function invalidateFocusedQueries(queryClient: QueryClient): void {
  for (const keys of focused.values()) {
    for (const queryKey of keys) {
      void queryClient.invalidateQueries({ queryKey });
    }
  }
}
