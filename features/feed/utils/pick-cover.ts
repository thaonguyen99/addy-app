import type { MemoryImage } from "@/types/api";

/** Picks the image to represent a memory: the explicit cover, else the lowest sortOrder. */
export function pickCover(images: MemoryImage[]): MemoryImage | null {
  if (images.length === 0) return null;
  const cover = images.find((img) => img.type === "cover");
  if (cover) return cover;
  return [...images].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
}
