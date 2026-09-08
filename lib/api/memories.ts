import { apiClient } from "@/lib/api/client";
import { parseApiResponse } from "@/lib/api/errors";
import type {
  CreateMemoryInput,
  MapBounds,
  MapPinsResult,
  MemoryDetail,
  MemoryListItem,
  MemoryListParams,
  MemoryListResult,
  MemoryPin,
} from "@/types/api";

const FEED_PAGE_SIZE = 20;

export async function createMemory(input: CreateMemoryInput) {
  return parseApiResponse<MemoryDetail>(
    (await apiClient.post("/memories", input)).data,
  );
}

export async function getMemory(id: string) {
  return parseApiResponse<MemoryDetail>(
    (await apiClient.get(`/memories/${id}`)).data,
  );
}

/** Cursor-paginated list of every memory the signed-in user has created,
 * newest first. Powers the map feed drawer. */
export async function listMemories(
  params: MemoryListParams = {},
): Promise<MemoryListResult> {
  const response = await apiClient.get("/memories", {
    params: {
      limit: params.limit ?? FEED_PAGE_SIZE,
      cursor: params.cursor,
    },
  });
  const body = response.data as {
    success: boolean;
    data: MemoryListItem[];
    meta?: { nextCursor?: string; cursor?: string };
  };

  if (!body.success) {
    return parseApiResponse<MemoryListItem[]>(body) as never;
  }

  return {
    items: body.data,
    nextCursor: body.meta?.nextCursor ?? body.meta?.cursor,
  };
}

export async function getMapPins(bounds: MapBounds): Promise<MapPinsResult> {
  const response = await apiClient.get("/memories/map", { params: bounds });
  const body = response.data as {
    success: boolean;
    data: MemoryPin[];
    meta?: { cursor?: string };
  };

  if (!body.success) {
    return parseApiResponse<MemoryPin[]>(body) as never;
  }

  return {
    pins: body.data,
    cursor: body.meta?.cursor,
  };
}
