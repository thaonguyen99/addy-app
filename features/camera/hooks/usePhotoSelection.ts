import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ensureMediaLibraryReadAccess } from "@/features/camera/permissions/media-library-access";
import { persistImageToDrafts } from "@/features/drafts/draft-image-storage";
import type { AddyMemoryImage } from "@/types/addy-memory";

export type PickFromGalleryResult =
  | { ok: true }
  | { ok: false; reason: "cancelled" }
  | { ok: false; reason: "permission_denied"; canAskAgain: boolean };

const IMAGE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsMultipleSelection: true,
  quality: 0.9,
};

export function usePhotoSelection(sessionPhotos: readonly AddyMemoryImage[]) {
  const [galleryPhotos, setGalleryPhotos] = useState<AddyMemoryImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );

  const allPhotos = useMemo(
    () => [...sessionPhotos, ...galleryPhotos],
    [sessionPhotos, galleryPhotos]
  );

  const knownPhotoIdsRef = useRef<ReadonlySet<string>>(new Set());

  useEffect(() => {
    const currentIds = new Set(allPhotos.map((photo) => photo.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      let changed = false;

      for (const id of currentIds) {
        if (!knownPhotoIdsRef.current.has(id)) {
          next.add(id);
          changed = true;
        }
      }

      for (const id of next) {
        if (!currentIds.has(id)) {
          next.delete(id);
          changed = true;
        }
      }

      knownPhotoIdsRef.current = currentIds;
      return changed ? next : prev;
    });
  }, [allPhotos]);

  const selectionKey = useMemo(
    () => [...selectedIds].sort().join("|"),
    [selectedIds]
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectedPhotos = useMemo(() => {
    return allPhotos.filter((p) => selectedIds.has(p.id));
  }, [allPhotos, selectedIds]);

  const pickFromGallery = useCallback(async (): Promise<PickFromGalleryResult> => {
    const access = await ensureMediaLibraryReadAccess();
    if (access.access === "denied") {
      return {
        ok: false,
        reason: "permission_denied",
        canAskAgain: access.canAskAgain,
      };
    }

    const result = await ImagePicker.launchImageLibraryAsync(IMAGE_PICKER_OPTIONS);

    if (result.canceled) {
      return { ok: false, reason: "cancelled" };
    }

    const assets = result.assets ?? [];
    const additions = await Promise.all(
      assets.map((asset) => persistImageToDrafts(asset.uri, "uploaded"))
    );
    setGalleryPhotos((prev) => [...prev, ...additions]);
    return { ok: true };
  }, []);

  return {
    allPhotos,
    selectedIds,
    selectionKey,
    toggleSelection,
    selectedPhotos,
    pickFromGallery,
  };
}
