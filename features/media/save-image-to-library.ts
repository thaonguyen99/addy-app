import * as MediaLibrary from "expo-media-library";

export type SaveImageResult = "saved" | "denied" | "failed";

/**
 * Saves a local photo to the device's photo library. Asks for write-only
 * access, so it never needs (or prompts for) read access to the library.
 */
export async function saveImageToLibrary(uri: string): Promise<SaveImageResult> {
  try {
    const permission = await MediaLibrary.requestPermissionsAsync(true, ["photo"]);
    if (!permission.granted) return "denied";
    await MediaLibrary.saveToLibraryAsync(uri);
    return "saved";
  } catch {
    return "failed";
  }
}
