import { useFocusEffect } from "@react-navigation/native";
import * as MediaLibrary from "expo-media-library";
import { useCallback, useState } from "react";

/**
 * URI of the newest photo in the library, for the capture screen's gallery
 * tile. Never prompts: it only reads when access was already granted (e.g.
 * from an earlier gallery pick), otherwise it stays null and the tile shows
 * an icon.
 */
export function useLastLibraryPhoto(): string | null {
  const [uri, setUri] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        try {
          const permission = await MediaLibrary.getPermissionsAsync();
          if (!permission.granted || permission.accessPrivileges === "none") return;
          const page = await MediaLibrary.getAssetsAsync({
            first: 1,
            mediaType: MediaLibrary.MediaType.photo,
            sortBy: [[MediaLibrary.SortBy.creationTime, false]],
          });
          if (!cancelled) setUri(page.assets[0]?.uri ?? null);
        } catch {
          // Fall back to the icon.
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return uri;
}
