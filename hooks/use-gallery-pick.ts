import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { ensureMediaLibraryReadAccess } from "@/features/camera/permissions/media-library-access";
import { cropCenterSquare } from "@/utils/crop-square";
import { persistImageToDrafts } from "@/features/drafts/draft-image-storage";
import type { AddyMemoryImage } from "@/types/addy-memory";

/**
 * Picks one or more photos from the library as square drafts, center-cropped
 * to 1:1 (the system crop editor doesn't work with multi-select). Returns []
 * when cancelled or denied.
 */
export function useGalleryPick() {
  const [picking, setPicking] = useState(false);

  const pick = useCallback(
    async (): Promise<AddyMemoryImage[]> => {
      const access = await ensureMediaLibraryReadAccess();
      if (access.access === "denied") {
        Alert.alert(
          "Photo library",
          access.canAskAgain
            ? "Allow photo access when prompted, or enable it in Settings to pick from your gallery."
            : "Photo access is off for Addy. You can turn it on in Settings.",
        );
        return [];
      }

      setPicking(true);
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.9,
          allowsMultipleSelection: true,
        });
        if (result.canceled) return [];

        return await Promise.all(
          (result.assets ?? []).map(async (asset) =>
            persistImageToDrafts(await cropCenterSquare(asset.uri), "uploaded"),
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
