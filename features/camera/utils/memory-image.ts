import type * as ImagePicker from 'expo-image-picker';

import { createMemoryImageId } from '@/features/camera/utils/id';
import type { AddyMemoryImage } from '@/types/addy-memory';

export function uploadedMemoryImagesFromAssets(
  assets: readonly ImagePicker.ImagePickerAsset[]
): AddyMemoryImage[] {
  return assets.map((asset) => ({
    id: createMemoryImageId(),
    uri: asset.uri,
    sourceType: 'uploaded' as const,
    createdAt: new Date().toISOString(),
  }));
}
