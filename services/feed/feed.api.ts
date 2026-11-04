import { apiGet, apiPost, apiPut } from "@/services/api/client";
import type { ToggleReactionResult } from "@/services/memories/memories.type";
import type { FeedPage } from "./feed.type";

const FEED_PAGE_SIZE = 20;

async function getFeed(cursor?: string) {
  return apiGet<FeedPage>("/feed", { limit: FEED_PAGE_SIZE, cursor });
}

/** Idempotent like for double-tap; never unlikes. */
async function likeMemory(id: string) {
  return apiPut<unknown>(`/memories/${id}/like`);
}

/** Tapping the heart: likes, or unlikes when already liked. */
async function toggleLike(id: string) {
  return apiPost<ToggleReactionResult>(`/memories/${id}/reactions/toggle`);
}

export const feedApi = { getFeed, likeMemory, toggleLike };
