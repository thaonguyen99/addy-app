import { apiGet } from "@/lib/api/client";
import type { UserProfile, UserStats } from "@/types/api";

export async function getProfile() {
  return apiGet<UserProfile>("/users/me");
}

export async function getStats() {
  return apiGet<UserStats>("/users/me/stats");
}
