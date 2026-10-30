import * as MediaLibrary from "expo-media-library";
import { router } from "expo-router";
import { Alert, Linking } from "react-native";

import { type PickedPhoto, usePhotoPickerStore } from "@/stores/photo-picker.store";

/** Same cap as the server and the multi-upload endpoint. */
export const MAX_PICKED_PHOTOS = 20;

async function ensurePhotoLibraryAccess(): Promise<boolean> {
  const current = await MediaLibrary.getPermissionsAsync(false, ["photo"]);
  if (current.granted) return true;

  const requested = current.canAskAgain
    ? await MediaLibrary.requestPermissionsAsync(false, ["photo"])
    : current;
  if (requested.granted) return true;

  Alert.alert(
    "Photos access needed",
    "Allow access to your photo library to add photos to your memory.",
    requested.canAskAgain
      ? [{ text: "OK" }]
      : [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => void Linking.openSettings() },
        ],
  );
  return false;
}

/**
 * Opens the in-app photo picker, where each photo is framed into the square
 * post crop. Resolves with the cropped photos in selection order, or [] when
 * cancelled or photo access is denied.
 */
export async function openPhotoPicker({
  limit = MAX_PICKED_PHOTOS,
}: { limit?: number } = {}): Promise<PickedPhoto[]> {
  if (limit < 1 || !(await ensurePhotoLibraryAccess())) return [];

  return new Promise((resolve) => {
    usePhotoPickerStore.getState().open({ limit, resolve });
    router.push("/photo-picker");
  });
}
