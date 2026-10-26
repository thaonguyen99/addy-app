import type * as ImagePicker from 'expo-image-picker';

import { createMemoryImageId } from '@/utils/memory-image-id';
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
