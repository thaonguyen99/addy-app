import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import { API_BASE_URL } from "@/lib/env";
import { parseApiResponse, toApiClientError } from "@/lib/api/errors";
import type { AuthTokens } from "@/types/api";

type TokenGetter = () => string | null;
type TokenUpdater = (tokens: AuthTokens) => Promise<void> | void;
type SignOutHandler = () => Promise<void> | void;

let getAccessToken: TokenGetter = () => null;
let getRefreshToken: TokenGetter = () => null;
let onTokensUpdated: TokenUpdater = () => {};
let onSignOut: SignOutHandler = () => {};

export function configureApiClient(handlers: {
  getAccessToken: TokenGetter;
  getRefreshToken: TokenGetter;
  onTokensUpdated: TokenUpdater;
  onSignOut: SignOutHandler;
}) {
  getAccessToken = handlers.getAccessToken;
  getRefreshToken = handlers.getRefreshToken;
  onTokensUpdated = handlers.onTokensUpdated;
  onSignOut = handlers.onSignOut;
}

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 30_000,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<AuthTokens> | null = null;

async function refreshAccessToken(): Promise<AuthTokens> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const response = await axios.post(
    `${API_BASE_URL}/api/v1/auth/refresh`,
    { refreshToken },
    { timeout: 15_000 }
  );

  const tokens = parseApiResponse<AuthTokens>(response.data);
  await onTokensUpdated(tokens);
  return tokens;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const url = original?.url ?? "";
    const isPublicAuthRoute =
      url.includes("/auth/refresh") ||
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/google") ||
      url.includes("/auth/verify-otp") ||
      url.includes("/auth/resend-otp") ||
      url.includes("/auth/forgot-password") ||
      url.includes("/auth/reset-password");

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !isPublicAuthRoute
    ) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
        }
        const tokens = await refreshPromise;
        original.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient(original);
      } catch {
        await onSignOut();
      }
    }

    return Promise.reject(toApiClientError(error));
  }
);

export async function apiGet<T>(url: string, params?: Record<string, unknown>) {
  const response = await apiClient.get(url, { params });
  return parseApiResponse<T>(response.data);
}

export async function apiPost<T>(url: string, body?: unknown) {
  const response = await apiClient.post(url, body);
  return parseApiResponse<T>(response.data);
}
