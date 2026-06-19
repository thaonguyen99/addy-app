import * as ImagePicker from 'expo-image-picker';

import type { MediaLibraryAccessResult } from '@/features/camera/permissions/types';

/**
 * Ensures read access for `launchImageLibraryAsync` without redundant prompts when already granted.
 */
export async function ensureMediaLibraryReadAccess(): Promise<MediaLibraryAccessResult> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) {
    return { access: 'granted' };
  }

  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (requested.granted) {
    return { access: 'granted' };
  }

  return {
    access: 'denied',
    canAskAgain: requested.canAskAgain ?? false,
  };
}
