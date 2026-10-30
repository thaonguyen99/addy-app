import { useMutation } from "@tanstack/react-query";

import { mediaApi } from "./media.api";

export function useUploadAvatarMutation() {
  return useMutation({ mutationFn: mediaApi.uploadAvatar });
}
