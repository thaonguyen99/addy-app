import {
  apiClient,
  apiDelete,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from "@/services/api/client";
import { parseApiResponse } from "@/services/api/errors";
import type { ClusterMemory, CreateMemoryInput, FriendMemoryPin, MapScope, MapBounds, MapPinsResult, MemoryDetail, MemoryListItem, MemoryListParams, MemoryListResult, MemoryPin, Reactor, ToggleReactionResult, UpdateMemoryInput } from "./memories.type";
import type { Paginated } from "@/types/api";

const FEED_PAGE_SIZE = 20;

async function createMemory(input: CreateMemoryInput) {
  return parseApiResponse<MemoryDetail>(
    (await apiClient.post("/memories", input)).data,
  );
}

async function getMemory(id: string) {
  return parseApiResponse<MemoryDetail>(
    (await apiClient.get(`/memories/${id}`)).data,
  );
}

/** Cursor-paginated list of every memory the signed-in user has created,
 * newest first. Powers the map feed drawer. */
async function listMemories(
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

async function getMapPins(bounds: MapBounds): Promise<MapPinsResult> {
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

/** Friends' shared memories in a viewport — server-filtered by visibility + block. */
async function getFriendsMapPins(
  bounds: MapBounds,
): Promise<{ pins: FriendMemoryPin[]; cursor?: string }> {
  const { items, nextCursor } = await apiGetPaginated<FriendMemoryPin>(
    "/memories/friends-map",
    { ...bounds },
  );
  return { pins: items, ...(nextCursor ? { cursor: nextCursor } : {}) };
}

/** Every memory one map layer shows at these places — for the cluster sheet.
 * Matches the pins' `memoryCount`s exactly (same server-side filter). */
async function getMemoriesByPlaces(placeIds: string[], scope: MapScope) {
  return apiPost<ClusterMemory[]>("/memories/by-places", { placeIds, scope });
}

async function updateMemory(id: string, input: UpdateMemoryInput) {
  return apiPatch<MemoryDetail>(`/memories/${id}`, input);
}

async function deleteMemory(id: string) {
  return apiDelete<{ deleted: boolean }>(`/memories/${id}`);
}

/** Remove yourself from a memory you're tagged on. */
async function untagSelf(id: string) {
  return apiDelete<{ untagged: boolean }>(`/memories/${id}/tags/me`);
}

async function toggleReaction(memoryId: string) {
  return parseApiResponse<ToggleReactionResult>(
    (await apiClient.post(`/memories/${memoryId}/reactions/toggle`)).data,
  );
}

async function listReactors(
  memoryId: string,
  cursor?: string,
): Promise<Paginated<Reactor>> {
  return apiGetPaginated<Reactor>(`/memories/${memoryId}/reactions`, { cursor });
}

export const memoryApi = {
  createMemory,
  getMemory,
  listMemories,
  getMapPins,
  getFriendsMapPins,
  getMemoriesByPlaces,
  updateMemory,
  deleteMemory,
  untagSelf,
  toggleReaction,
  listReactors,
};
