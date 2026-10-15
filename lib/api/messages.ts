import {
  apiClient,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from "@/lib/api/client";
import { parseApiResponse } from "@/lib/api/errors";
import type {
  MemoryMessage,
  MessageLikeResult,
  Paginated,
  PublicUser,
} from "@/types/api";

export const MESSAGES_PAGE_SIZE = 30;

/** A page of a memory's thread, oldest→newest. The first page is the newest
 * one; `nextCursor` fetches the next-older page. */
export async function listMessages(
  memoryId: string,
  cursor?: string,
): Promise<Paginated<MemoryMessage>> {
  return apiGetPaginated<MemoryMessage>(`/memories/${memoryId}/messages`, {
    limit: MESSAGES_PAGE_SIZE,
    cursor,
  });
}

/** Friends the viewer can tag in this memory's thread. */
export async function listMentionable(memoryId: string) {
  return apiGet<PublicUser[]>(`/memories/${memoryId}/mentionable`, {
    limit: 100,
  });
}

export async function postMessage(memoryId: string, text: string) {
  return apiPost<MemoryMessage>(`/memories/${memoryId}/messages`, { text });
}

export async function editMessage(messageId: string, text: string) {
  return apiPatch<MemoryMessage>(`/messages/${messageId}`, { text });
}

/** 204 with no body — skip `parseApiResponse`, which would throw on it. */
export async function deleteMessage(messageId: string) {
  await apiClient.delete(`/messages/${messageId}`);
}

export async function likeMessage(messageId: string) {
  return parseApiResponse<MessageLikeResult>(
    (await apiClient.put(`/messages/${messageId}/like`)).data,
  );
}

export async function unlikeMessage(messageId: string) {
  return parseApiResponse<MessageLikeResult>(
    (await apiClient.delete(`/messages/${messageId}/like`)).data,
  );
}
