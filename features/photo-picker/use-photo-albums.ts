import * as MediaLibrary from "expo-media-library";
import { useEffect, useState } from "react";

export type PhotoAlbum = {
  id: string;
  title: string;
  /** Newest photo in the album. */
  coverUri: string;
};

/**
 * Albums that hold at least one photo the app can see, each with its newest
 * photo as cover. Loads when `enabled` first turns on (the album sheet opens).
 */
export function usePhotoAlbums(enabled: boolean) {
  const [albums, setAlbums] = useState<PhotoAlbum[] | null>(null);

  useEffect(() => {
    if (!enabled || albums) return;
    let cancelled = false;
    void (async () => {
      try {
        const all = await MediaLibrary.getAlbumsAsync();
        const withCovers = await Promise.all(
          all.map(async (album) => {
            const page = await MediaLibrary.getAssetsAsync({
              album,
              first: 1,
              mediaType: MediaLibrary.MediaType.photo,
              sortBy: [[MediaLibrary.SortBy.creationTime, false]],
            });
            const cover = page.assets[0];
            return cover
              ? { id: album.id, title: album.title, coverUri: cover.uri }
              : null;
          }),
        );
        if (!cancelled) setAlbums(withCovers.filter((a) => a !== null));
      } catch (error) {
        console.warn("[photo-picker] could not read albums", error);
        if (!cancelled) setAlbums([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, albums]);

  return albums;
}
