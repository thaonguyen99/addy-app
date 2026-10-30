import { useCallback, useState } from "react";

import { openPhotoPicker } from "@/features/photo-picker/open-photo-picker";
import { persistImageToDrafts } from "@/features/drafts/draft-image-storage";
import type { AddyMemoryImage } from "@/types/addy-memory";

/**
 * Picks one or more photos from the library as square drafts, each framed by
 * the user in the in-app picker. Returns [] when cancelled or denied.
 */
export function useGalleryPick() {
  const [picking, setPicking] = useState(false);

  const pick = useCallback(
    async (limit?: number): Promise<AddyMemoryImage[]> => {
      const photos = await openPhotoPicker({ limit });
      if (photos.length === 0) return [];

      setPicking(true);
      try {
        return await Promise.all(
          photos.map((photo) =>
            persistImageToDrafts(photo.uri, "uploaded", photo.takenAt),
          ),
        );
      } finally {
        setPicking(false);
      }
    },
    [],
  );

  return { pick, picking };
}
