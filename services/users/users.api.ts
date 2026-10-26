import type { AuthTokens } from "@/services/auth";
import {
  apiDelete,
  apiGet,
  apiGetPaginated,
  apiPatch,
  apiPost,
} from "../api/client";
import type {
  ChangePasswordInput,
  ProfileMemoryItem,
  UpdateProfileInput,
  UsernameAvailableResult,
  UserProfile,
  UserProfilePage,
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

async function getUserProfile(username: string) {
  return apiGet<UserProfilePage>(
    `/users/${encodeURIComponent(username)}/profile`,
  );
}

async function listUserMemories(username: string, cursor?: string) {
  return apiGetPaginated<ProfileMemoryItem>(
    `/users/${encodeURIComponent(username)}/memories`,
    { cursor },
  );
}

export const userApi = {
  getUserProfile,
  listUserMemories,
  deleteAccount,
  changePassword,
  checkUsernameAvailable,
  completeOnboarding,
  updateProfile,
  getStats,
  getProfile,
};
