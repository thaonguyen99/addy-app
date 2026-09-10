import {
  apiDelete,
  apiGetPaginated,
  apiPost,
} from "@/lib/api/client";
import type {
  Friend,
  FriendRequest,
  FriendRequestDirection,
  Paginated,
} from "@/types/api";

export async function listFriends(cursor?: string): Promise<Paginated<Friend>> {
  return apiGetPaginated<Friend>("/friends", { cursor, limit: 30 });
}

export async function unfriend(userId: string) {
  return apiDelete<{ removed: boolean }>(`/friends/${userId}`);
}

export async function listFriendRequests(
  direction: FriendRequestDirection,
  cursor?: string,
): Promise<Paginated<FriendRequest>> {
  return apiGetPaginated<FriendRequest>("/friends/requests", {
    direction,
    cursor,
    limit: 30,
  });
}

export async function sendFriendRequest(userId: string) {
  return apiPost<{ status: "requested" | "friends" }>("/friends/requests", {
    userId,
  });
}

export async function acceptFriendRequest(id: string) {
  return apiPost<{ status: string }>(`/friends/requests/${id}/accept`);
}

export async function declineFriendRequest(id: string) {
  return apiPost<{ status: string }>(`/friends/requests/${id}/decline`);
}

export async function cancelFriendRequest(id: string) {
  return apiDelete<{ status: string }>(`/friends/requests/${id}`);
}
