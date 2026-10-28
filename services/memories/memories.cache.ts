import type { InfiniteData, QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/services/query/keys";
import { pickCover } from "@/utils/pick-cover";
import type {
  MapPinsResult,
  MemoryDetail,
  MemoryListItem,
  MemoryListResult,
} from "./memories.type";

/** `mapBoundsKey` format: "north:south:east:west". */
function boundsContain(boundsKey: unknown, lat: number, lng: number): boolean {
  if (typeof boundsKey !== "string") return false;
  const [north, south, east, west] = boundsKey.split(":").map(Number);
  if ([north, south, east, west].some((n) => !Number.isFinite(n))) return false;
  return lat <= north && lat >= south && lng <= east && lng >= west;
}

/**
 * A memory I just created: put it in the detail, feed and my map caches right
 * away, so the queued pin hands over to the real one without a blink while
 * the refetch catches up.
 */
export function insertOwnMemory(queryClient: QueryClient, memory: MemoryDetail) {
  queryClient.setQueryData(queryKeys.memory(memory.id), memory);

  const listItem: MemoryListItem = {
    id: memory.id,
    images: memory.images,
    moodScore: memory.moodScore,
    feeling: memory.feeling,
    visibility: memory.visibility,
    isOwner: true,
    reactionCount: memory.reactionCount,
    hasReacted: memory.hasReacted,
    messageCount: memory.messageCount,
    capturedAt: memory.capturedAt,
    createdAt: memory.createdAt,
    place: memory.place,
  };
  queryClient.setQueryData<InfiniteData<MemoryListResult>>(
    queryKeys.memoriesFeed,
    (data) =>
      data &&
      !data.pages.some((page) => page.items.some((item) => item.id === memory.id))
        ? {
            ...data,
            pages: data.pages.map((page, i) =>
              i === 0 ? { ...page, items: [listItem, ...page.items] } : page,
            ),
          }
        : data,
  );

  const { latitude, longitude, id: placeId, name } = memory.place;
  const imageUrl = pickCover(memory.images)?.url ?? memory.images[0]?.url;
  if (!imageUrl) return;
  for (const [key, data] of queryClient.getQueriesData<MapPinsResult>({
    queryKey: ["memories", "map"],
  })) {
    if (!data || !boundsContain(key[2], latitude, longitude)) continue;
    if (data.pins.some((pin) => pin.id === memory.id)) continue;
    const atPlace = data.pins.find((pin) => pin.placeId === placeId);
    const pin = {
      id: memory.id,
      placeId,
      latitude,
      longitude,
      capturedAt: memory.capturedAt,
      imageUrl,
      memoryCount: (atPlace?.memoryCount ?? 0) + 1,
      placeName: name,
      moodScore: memory.moodScore,
      extraPhotoCount: Math.max(0, memory.images.length - 1),
    };
    queryClient.setQueryData<MapPinsResult>(key, {
      ...data,
      pins: atPlace
        ? data.pins.map((p) => (p.placeId === placeId ? pin : p))
        : [...data.pins, pin],
    });
  }
}
