import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type {
  AuthTokens,
  ChangePasswordInput,
  UpdateProfileInput,
  UsernameAvailableResult,
  UserProfile,
  UserStats,
} from "@/types/api";

export async function getProfile() {
  return apiGet<UserProfile>("/users/me");
}

export async function getStats() {
  return apiGet<UserStats>("/users/me/stats");
}

export async function updateProfile(input: UpdateProfileInput) {
  return apiPatch<UserProfile>("/users/me", input);
}

export async function completeOnboarding() {
  return apiPost<UserProfile>("/users/me/complete-onboarding");
}

export async function deleteAccount() {
  return apiDelete<{ message: string }>("/users/me");
}

export async function changePassword(input: ChangePasswordInput) {
  return apiPost<{ tokens: AuthTokens }>("/users/me/change-password", input);
}

export async function checkUsernameAvailable(username: string) {
  return apiGet<UsernameAvailableResult>("/users/username-available", {
    username,
  });
}
