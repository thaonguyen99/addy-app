import { apiClient } from "@/lib/api/client";
import { parseApiResponse } from "@/lib/api/errors";
import type {
  CreateMemoryInput,
  MapBounds,
  MapPinsResult,
  MemoryDetail,
  MemoryPin,
} from "@/types/api";

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
