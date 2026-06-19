import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

import { createMemoryImageId } from "@/features/camera/utils/id";
import type { AddyMemoryImage, MemoryImageSourceType } from "@/types/addy-memory";

const DRAFT_INDEX_KEY = "addy.draftImages";
const DRAFT_DIR = `${FileSystem.documentDirectory}addy-drafts/`;

type DraftIndexEntry = {
  id: string;
  uri: string;
  sourceType: MemoryImageSourceType;
  createdAt: string;
};

async function ensureDraftDir() {
  const info = await FileSystem.getInfoAsync(DRAFT_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DRAFT_DIR, { intermediates: true });
  }
}

async function readIndex(): Promise<DraftIndexEntry[]> {
  const raw = await AsyncStorage.getItem(DRAFT_INDEX_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as DraftIndexEntry[];
  } catch {
    return [];
  }
}

async function writeIndex(entries: DraftIndexEntry[]) {
  await AsyncStorage.setItem(DRAFT_INDEX_KEY, JSON.stringify(entries));
}

export async function loadDraftImages(): Promise<AddyMemoryImage[]> {
  const index = await readIndex();
  const valid: AddyMemoryImage[] = [];

  for (const entry of index) {
    const info = await FileSystem.getInfoAsync(entry.uri);
    if (info.exists) {
      valid.push({
        id: entry.id,
        uri: entry.uri,
        sourceType: entry.sourceType,
        createdAt: entry.createdAt,
      });
    }
  }

  if (valid.length !== index.length) {
    await writeIndex(
      valid.map((v) => ({
        id: v.id,
        uri: v.uri,
        sourceType: v.sourceType,
        createdAt: v.createdAt,
      }))
    );
  }

  return valid.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function persistImageToDrafts(
  sourceUri: string,
  sourceType: MemoryImageSourceType
): Promise<AddyMemoryImage> {
  await ensureDraftDir();
  const id = createMemoryImageId();
  const dest = `${DRAFT_DIR}${id}.jpg`;

  await FileSystem.copyAsync({ from: sourceUri, to: dest });

  const image: AddyMemoryImage = {
    id,
    uri: dest,
    sourceType,
    createdAt: new Date().toISOString(),
  };

  const index = await readIndex();
  index.unshift({
    id: image.id,
    uri: image.uri,
    sourceType: image.sourceType,
    createdAt: image.createdAt,
  });
  await writeIndex(index);

  return image;
}

export async function removeDraftImage(id: string) {
  const index = await readIndex();
  const entry = index.find((e) => e.id === id);
  if (entry) {
    await FileSystem.deleteAsync(entry.uri, { idempotent: true });
  }
  await writeIndex(index.filter((e) => e.id !== id));
}

export async function removeDraftImages(ids: readonly string[]) {
  await Promise.all(ids.map((id) => removeDraftImage(id)));
}
