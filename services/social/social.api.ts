import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPost,
} from "@/services/api/client";
import type { AcceptInviteResult, BlockedUser, InviteInfo, InvitePreview, UserSearchResult } from "./social.type";
import type { Paginated } from "@/types/api";

async function searchUsers(
  q: string,
  cursor?: string,
): Promise<Paginated<UserSearchResult>> {
  return apiGetPaginated<UserSearchResult>("/users/search", { q, cursor });
}

async function getMyInvite() {
  return apiGet<InviteInfo>("/users/me/invite");
}

async function rotateInvite() {
  return apiPost<InviteInfo>("/users/me/invite/rotate");
}

async function blockUser(userId: string) {
  return apiPost<{ blocked: boolean }>("/blocks", { userId });
}

async function unblockUser(userId: string) {
  return apiDelete<{ blocked: boolean }>(`/blocks/${userId}`);
}

async function listBlockedUsers(
  cursor?: string,
): Promise<Paginated<BlockedUser>> {
  return apiGetPaginated<BlockedUser>("/blocks", { cursor, limit: 30 });
}

async function getInvitePreview(token: string) {
  return apiGet<InvitePreview>(`/invites/${encodeURIComponent(token)}`);
}

async function acceptInvite(token: string) {
  return apiPost<AcceptInviteResult>(
    `/invites/${encodeURIComponent(token)}/accept`,
  );
}

export const socialApi = {
  searchUsers,
  getMyInvite,
  rotateInvite,
  blockUser,
  unblockUser,
  listBlockedUsers,
  getInvitePreview,
  acceptInvite,
};
