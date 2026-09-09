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

/**
 * Generous timeout: the API runs on Render's free tier, which cold-starts in
 * ~40–50s after idle. A shorter timeout makes the first request after a while
 * (e.g. Google sign-in) fail even though the server is on its way up.
 */
const REQUEST_TIMEOUT_MS = 60_000;

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: REQUEST_TIMEOUT_MS,
});

/**
 * Fire-and-forget nudge to wake a cold Render instance. Call it as early as
 * possible (e.g. when an auth screen mounts) so the server is warming while the
 * user reads the screen / picks a Google account.
 */
export function warmUpApi(): void {
  void axios
    .get(`${API_BASE_URL}/health`, { timeout: REQUEST_TIMEOUT_MS })
    .catch(() => {
      // best-effort only
    });
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * The refresh token was actually rejected by the server (or is missing) — the
 * session is dead and the caller should sign out. A network error / timeout is
 * NOT this: it surfaces as the original error so the session is kept.
 */
export class RefreshRejectedError extends Error {
  constructor() {
    super("Session expired");
    this.name = "RefreshRejectedError";
  }
}

let refreshPromise: Promise<AuthTokens> | null = null;

async function requestFreshTokens(): Promise<AuthTokens> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new RefreshRejectedError();
  }

  const response = await axios
    .post(
      `${API_BASE_URL}/api/v1/auth/refresh`,
      { refreshToken },
      { timeout: REQUEST_TIMEOUT_MS }
    )
    .catch((error: AxiosError) => {
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        throw new RefreshRejectedError();
      }
      throw error; // transient (network / timeout / 5xx) — keep the session
    });

  const tokens = parseApiResponse<AuthTokens>(response.data);
  await onTokensUpdated(tokens);
  return tokens;
}

/**
 * Exchange the refresh token for a fresh pair. Deduped: concurrent callers (a
 * burst of 401s, or the startup check racing the first query) share one request.
 * Resolves with the new tokens (already persisted via `onTokensUpdated`), or
 * rejects — with `RefreshRejectedError` when the session is genuinely dead.
 */
export function refreshSession(): Promise<AuthTokens> {
  if (!refreshPromise) {
    refreshPromise = requestFreshTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
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
        const tokens = await refreshSession();
        original.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient(original);
      } catch (refreshError) {
        // Only give up the session if the server actually rejected the refresh
        // token — a network blip / cold-start timeout keeps you signed in.
        if (refreshError instanceof RefreshRejectedError) {
          await onSignOut();
        }
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
