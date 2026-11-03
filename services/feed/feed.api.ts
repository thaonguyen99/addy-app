import { apiGet, apiPut } from "@/services/api/client";
import type { FeedPage } from "./feed.type";

const FEED_PAGE_SIZE = 20;

async function getFeed(cursor?: string) {
  return apiGet<FeedPage>("/feed", { limit: FEED_PAGE_SIZE, cursor });
}

/** Idempotent like for double-tap; never unlikes. */
async function likeMemory(id: string) {
  return apiPut<unknown>(`/memories/${id}/like`);
}

export const feedApi = { getFeed, likeMemory };
