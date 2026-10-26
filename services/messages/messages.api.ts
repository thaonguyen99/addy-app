import {
  apiClient,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from "@/services/api/client";
import { parseApiResponse } from "@/services/api/errors";
import type { MemoryMessage, MessageLikeResult } from "./messages.type";
import type { Paginated } from "@/types/api";
import type { PublicUser } from "@/services/users";

export const MESSAGES_PAGE_SIZE = 30;

/** A page of a memory's thread, oldest→newest. The first page is the newest
 * one; `nextCursor` fetches the next-older page. */
async function listMessages(
  memoryId: string,
  cursor?: string,
): Promise<Paginated<MemoryMessage>> {
  return apiGetPaginated<MemoryMessage>(`/memories/${memoryId}/messages`, {
    limit: MESSAGES_PAGE_SIZE,
    cursor,
  });
}

/** Friends the viewer can tag in this memory's thread. */
async function listMentionable(memoryId: string) {
  return apiGet<PublicUser[]>(`/memories/${memoryId}/mentionable`, {
    limit: 100,
  });
}

async function postMessage(memoryId: string, text: string) {
  return apiPost<MemoryMessage>(`/memories/${memoryId}/messages`, { text });
}

async function editMessage(messageId: string, text: string) {
  return apiPatch<MemoryMessage>(`/messages/${messageId}`, { text });
}

/** 204 with no body — skip `parseApiResponse`, which would throw on it. */
async function deleteMessage(messageId: string) {
  await apiClient.delete(`/messages/${messageId}`);
}

async function likeMessage(messageId: string) {
  return parseApiResponse<MessageLikeResult>(
    (await apiClient.put(`/messages/${messageId}/like`)).data,
  );
}

async function unlikeMessage(messageId: string) {
  return parseApiResponse<MessageLikeResult>(
    (await apiClient.delete(`/messages/${messageId}/like`)).data,
  );
}

export const messageApi = {
  listMessages,
  listMentionable,
  postMessage,
  editMessage,
  deleteMessage,
  likeMessage,
  unlikeMessage,
};
