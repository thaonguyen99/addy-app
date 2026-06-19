import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  loadDraftImages,
  persistImageToDrafts,
  removeDraftImage,
} from "@/features/drafts/draft-image-storage";
import type { AddyMemoryImage } from "@/types/addy-memory";

export type CameraSessionContextValue = {
  capturedPhotos: AddyMemoryImage[];
  isLoadingDrafts: boolean;
  addCapturedPhotoFromUri: (uri: string) => Promise<AddyMemoryImage>;
  removeCapturedPhoto: (id: string) => Promise<void>;
  clearSession: () => void;
  reloadDrafts: () => Promise<void>;
};

const CameraSessionContext = createContext<CameraSessionContextValue | null>(
  null
);

export function CameraSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [capturedPhotos, setCapturedPhotos] = useState<AddyMemoryImage[]>([]);
  const [isLoadingDrafts, setIsLoadingDrafts] = useState(true);

  const reloadDrafts = useCallback(async () => {
    setIsLoadingDrafts(true);
    try {
      const drafts = await loadDraftImages();
      const quickSnaps = drafts.filter((d) => d.sourceType === "quick_snap");
      setCapturedPhotos(quickSnaps);
    } finally {
      setIsLoadingDrafts(false);
    }
  }, []);

  useEffect(() => {
    reloadDrafts();
  }, [reloadDrafts]);

  const addCapturedPhotoFromUri = useCallback(async (uri: string) => {
    const image = await persistImageToDrafts(uri, "quick_snap");
    setCapturedPhotos((prev) => [image, ...prev]);
    return image;
  }, []);

  const removeCapturedPhoto = useCallback(async (id: string) => {
    await removeDraftImage(id);
    setCapturedPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearSession = useCallback(() => {
    setCapturedPhotos([]);
  }, []);

  const value = useMemo(
    () => ({
      capturedPhotos,
      isLoadingDrafts,
      addCapturedPhotoFromUri,
      removeCapturedPhoto,
      clearSession,
      reloadDrafts,
    }),
    [
      capturedPhotos,
      isLoadingDrafts,
      addCapturedPhotoFromUri,
      removeCapturedPhoto,
      clearSession,
      reloadDrafts,
    ]
  );

  return (
    <CameraSessionContext.Provider value={value}>
      {children}
    </CameraSessionContext.Provider>
  );
}

export function useCameraSession() {
  const ctx = useContext(CameraSessionContext);
  if (!ctx) {
    throw new Error("useCameraSession must be used within CameraSessionProvider");
  }
  return ctx;
}
