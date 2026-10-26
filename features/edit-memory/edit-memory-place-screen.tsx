import type { Href } from "expo-router";
import { useEffect } from "react";

import { PlacePicker } from "@/features/camera/components/place-selection-screen";
import { useEditMemoryStore } from "@/stores/edit-memory.store";
import { safeBack } from "@/lib/safe-router";

/** Pick a new place for the memory being edited; writes it to the edit draft. */
export function EditMemoryPlaceScreen() {
  const memoryId = useEditMemoryStore((s) => s.memoryId);
  const setPlace = useEditMemoryStore((s) => s.setPlace);
  const backHref: Href = memoryId ? `/edit-memory/${memoryId}` : "/";

  // Opened without an edit in progress (e.g. a stale deep link).
  useEffect(() => {
    if (!memoryId) safeBack("/");
  }, [memoryId]);

  return (
    <PlacePicker
      backHref={backHref}
      onPick={(place) => {
        setPlace(place);
        safeBack(backHref);
      }}
      onUseCurrentLocation={(here) => {
        if (!here) return;
        setPlace(here);
        safeBack(backHref);
      }}
    />
  );
}
