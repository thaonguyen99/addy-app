import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPost,
} from "@/services/api/client";
import type { Friend, FriendRequest, FriendRequestDirection, FriendSuggestion } from "./friends.type";
import type { Paginated } from "@/types/api";

async function listFriends(cursor?: string): Promise<Paginated<Friend>> {
  return apiGetPaginated<Friend>("/friends", { cursor, limit: 30 });
}

async function unfriend(userId: string) {
  return apiDelete<{ removed: boolean }>(`/friends/${userId}`);
}

async function listFriendRequests(
  direction: FriendRequestDirection,
  cursor?: string,
): Promise<Paginated<FriendRequest>> {
  return apiGetPaginated<FriendRequest>("/friends/requests", {
    direction,
    cursor,
    limit: 30,
  });
}

async function sendFriendRequest(userId: string) {
  return apiPost<{ status: "requested" | "friends" }>("/friends/requests", {
    userId,
  });
}

async function acceptFriendRequest(id: string) {
  return apiPost<{ status: string }>(`/friends/requests/${id}/accept`);
}

async function declineFriendRequest(id: string) {
  return apiPost<{ status: string }>(`/friends/requests/${id}/decline`);
}

async function cancelFriendRequest(id: string) {
  return apiDelete<{ status: string }>(`/friends/requests/${id}`);
}

async function listFriendSuggestions(limit = 10) {
  return apiGet<FriendSuggestion[]>("/friends/suggestions", { limit });
}

export const friendApi = {
  listFriends,
  unfriend,
  listFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  listFriendSuggestions,
};
