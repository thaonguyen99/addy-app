import * as ImagePicker from "expo-image-picker";
import { useCallback, useState } from "react";
import { Alert } from "react-native";

import { ensureMediaLibraryReadAccess } from "@/features/camera/permissions/media-library-access";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  useUpdateProfileMutation,
  useUploadAvatarMutation,
} from "@/lib/query/hooks";

const AVATAR_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ["images"],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.85,
};

/** Pick one image, upload it to the avatar folder, then persist it on the profile. */
export function useAvatarUpload() {
  const uploadAvatar = useUploadAvatarMutation();
  const updateProfile = useUpdateProfileMutation();
  const [busy, setBusy] = useState(false);

  const pickAndUpload = useCallback(async () => {
    const access = await ensureMediaLibraryReadAccess();
    if (access.access === "denied") {
      Alert.alert(
        "Photo library",
        access.canAskAgain
          ? "Allow photo access when prompted to choose a picture."
          : "Photo access is off for Addy. You can turn it on in Settings.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync(
      AVATAR_PICKER_OPTIONS,
    );
    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    setBusy(true);
    try {
      const uploaded = await uploadAvatar.mutateAsync(result.assets[0].uri);
      await updateProfile.mutateAsync({
        avatarUrl: uploaded.imageUrl,
        avatarPublicId: uploaded.imagePublicId,
      });
    } catch (error) {
      Alert.alert(
        "Avatar",
        getApiErrorMessage(error, "Could not update your picture."),
      );
    } finally {
      setBusy(false);
    }
  }, [uploadAvatar, updateProfile]);

  return { pickAndUpload, busy };
}
