import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPost,
} from "@/lib/api/client";
import type {
  BlockedUser,
  InviteInfo,
  Paginated,
  ResolvedInvite,
  UserSearchResult,
} from "@/types/api";

export async function searchUsers(
  q: string,
  cursor?: string,
): Promise<Paginated<UserSearchResult>> {
  return apiGetPaginated<UserSearchResult>("/users/search", { q, cursor });
}

export async function getMyInvite() {
  return apiGet<InviteInfo>("/users/me/invite");
}

export async function rotateInvite() {
  return apiPost<InviteInfo>("/users/me/invite/rotate");
}

export async function resolveInvite(token: string) {
  return apiGet<ResolvedInvite>(`/users/invite/${encodeURIComponent(token)}`);
}

export async function blockUser(userId: string) {
  return apiPost<{ blocked: boolean }>("/blocks", { userId });
}

export async function unblockUser(userId: string) {
  return apiDelete<{ blocked: boolean }>(`/blocks/${userId}`);
}

export async function listBlockedUsers(
  cursor?: string,
): Promise<Paginated<BlockedUser>> {
  return apiGetPaginated<BlockedUser>("/blocks", { cursor, limit: 30 });
}
