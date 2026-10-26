import type { AuthTokens } from "@/services/auth";
import { apiDelete, apiGet, apiPatch, apiPost } from "../api/client";
import type {
  ChangePasswordInput,
  UpdateProfileInput,
  UsernameAvailableResult,
  UserProfile,
  UserStats,
} from "./users.type";

async function getProfile() {
  return apiGet<UserProfile>("/users/me");
}

async function getStats() {
  return apiGet<UserStats>("/users/me/stats");
}

async function updateProfile(input: UpdateProfileInput) {
  return apiPatch<UserProfile>("/users/me", input);
}

async function completeOnboarding() {
  return apiPost<UserProfile>("/users/me/complete-onboarding");
}

async function deleteAccount() {
  return apiDelete<{ message: string }>("/users/me");
}

async function changePassword(input: ChangePasswordInput) {
  return apiPost<{ tokens: AuthTokens }>("/users/me/change-password", input);
}

async function checkUsernameAvailable(username: string) {
  return apiGet<UsernameAvailableResult>("/users/username-available", {
    username,
  });
}

export const userApi = {
  deleteAccount,
  changePassword,
  checkUsernameAvailable,
  completeOnboarding,
  updateProfile,
  getStats,
  getProfile,
};
