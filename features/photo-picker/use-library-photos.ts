import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useRef, useState } from "react";

const PAGE_SIZE = 60;

/**
 * The photo library (or one album of it), newest first, a page at a time.
 * `limited` is true when the user shared only some photos (iOS / Android
 * 14+); `manage` lets them change that selection, and the list reloads when
 * the library changes.
 */
export function useLibraryPhotos(albumId: string | null) {
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [limited, setLimited] = useState(false);
  const page = useRef({ after: undefined as string | undefined, hasNext: true });
  const loading = useRef(false);
  // A reset (album switch, library change) outdates any page still loading.
  const generation = useRef(0);

  const load = useCallback(async (reset: boolean) => {
    if (!reset && (loading.current || !page.current.hasNext)) return;
    const current = reset ? ++generation.current : generation.current;
    loading.current = true;
    try {
      const result = await MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        after: reset ? undefined : page.current.after,
        mediaType: MediaLibrary.MediaType.photo,
        album: albumId ?? undefined,
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });
      if (current !== generation.current) return;
      page.current = { after: result.endCursor, hasNext: result.hasNextPage };
      setAssets((prev) => (reset ? result.assets : [...prev, ...result.assets]));
    } catch (error) {
      console.warn("[photo-picker] could not read the library", error);
    } finally {
      if (current === generation.current) {
        loading.current = false;
        setLoaded(true);
      }
    }
  }, [albumId]);

  useEffect(() => {
    void MediaLibrary.getPermissionsAsync(false, ["photo"]).then((p) =>
      setLimited(p.accessPrivileges === "limited"),
    );
    void load(true);
    const sub = MediaLibrary.addListener(() => void load(true));
    return () => sub.remove();
  }, [load]);

  const loadMore = useCallback(() => void load(false), [load]);

  const manage = useCallback(async () => {
    await MediaLibrary.presentPermissionsPickerAsync(["photo"]);
    void load(true);
  }, [load]);

  return { assets, loaded, limited, loadMore, manage };
}
