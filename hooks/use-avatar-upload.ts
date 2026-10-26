import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { ensureMediaLibraryReadAccess } from "@/features/camera/permissions/media-library-access";
import { prepareUploadImage } from "@/features/media/prepare-upload-image";
import { checkImageSafety } from "@/features/moderation/check-image-safety";
import { getApiErrorMessage } from "@/services/api/errors";
import { useUploadAvatarMutation } from "@/services/media";
import { cropCenterSquare } from "@/utils/crop-square";

const AVATAR_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
};

export type UploadedAvatar = { avatarUrl: string; avatarPublicId: string };

/**
 * Pick one image and upload it to the avatar folder. It isn't on the profile
 * until the caller saves it, so the Edit sheet can still be cancelled.
 */
export function useAvatarUpload() {
  const uploadAvatar = useUploadAvatarMutation();
  const [busy, setBusy] = useState(false);

  const pickAvatar = useCallback(async (): Promise<UploadedAvatar | null> => {
    const access = await ensureMediaLibraryReadAccess();
    if (access.access === "denied") {
      Alert.alert(
        "Photo library",
        access.canAskAgain
          ? "Allow photo access when prompted to choose a picture."
          : "Photo access is off for Addy. You can turn it on in Settings.",
      );
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync(
      AVATAR_PICKER_OPTIONS,
    );
    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    setBusy(true);
    try {
      // The picker's square crop isn't guaranteed (iOS can hand back the
      // full photo), so square it here. Already-square picks pass through.
      const square = await cropCenterSquare(result.assets[0].uri);
      // Re-encode first: strips EXIF/GPS before the photo leaves the device.
      const { uri: localUri } = await prepareUploadImage(square);
      const safety = await checkImageSafety(localUri);
      if (!safety.safe) {
        Alert.alert(
          "Photo",
          "This photo looks like it may violate our content guidelines. Please choose a different one.",
        );
        return null;
      }

      const uploaded = await uploadAvatar.mutateAsync(localUri);
      return {
        avatarUrl: uploaded.imageUrl,
        avatarPublicId: uploaded.imagePublicId,
      };
    } catch (error) {
      Alert.alert(
        "Avatar",
        getApiErrorMessage(error, "Could not update your picture."),
      );
      return null;
    } finally {
      setBusy(false);
    }
  }, [uploadAvatar]);

  return { pickAvatar, busy };
}
