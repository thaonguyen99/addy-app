import { create } from "zustand";

import { configureApiClient } from "@/lib/api/client";
import {
  clearPendingEmail,
  clearSession,
  getPendingEmail,
  loadStoredSession,
  saveSession,
  saveTokens,
  setPendingEmail,
} from "@/features/auth/storage/token-storage";
import type { AuthSession, AuthTokens, AuthUser, OtpPurpose } from "@/types/api";

export type AuthStatus =
  | "idle"
  | "hydrating"
  | "authenticated"
  | "unauthenticated";

type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  pendingEmail: string | null;
  pendingOtpPurpose: OtpPurpose | null;
  hydrate: () => Promise<void>;
  setSession: (session: AuthSession) => Promise<void>;
  updateTokens: (tokens: AuthTokens) => Promise<void>;
  setPendingVerification: (email: string, purpose: OtpPurpose) => Promise<void>;
  clearPendingVerification: () => Promise<void>;
  signOut: () => Promise<void>;
};

let apiConfigured = false;

function ensureApiConfigured(get: () => AuthState) {
  if (apiConfigured) return;
  apiConfigured = true;
  configureApiClient({
    getAccessToken: () => get().accessToken,
    getRefreshToken: () => get().refreshToken,
    onTokensUpdated: async (tokens) => {
      await get().updateTokens(tokens);
    },
    onSignOut: async () => {
      await get().signOut();
    },
  });
}

export const useAuthStore = create<AuthState>((set, get) => {
  ensureApiConfigured(get);

  return {
    status: "idle",
    user: null,
    accessToken: null,
    refreshToken: null,
    pendingEmail: null,
    pendingOtpPurpose: null,

    hydrate: async () => {
      set({ status: "hydrating" });
      const [stored, pendingEmail] = await Promise.all([
        loadStoredSession(),
        getPendingEmail(),
      ]);

      if (stored.user && stored.tokens) {
        set({
          status: "authenticated",
          user: stored.user,
          accessToken: stored.tokens.accessToken,
          refreshToken: stored.tokens.refreshToken,
          pendingEmail: pendingEmail ?? null,
        });
        return;
      }

      set({
        status: "unauthenticated",
        user: null,
        accessToken: null,
        refreshToken: null,
        pendingEmail: pendingEmail ?? null,
      });
    },

    setSession: async ({ user, tokens }) => {
      await saveSession(user, tokens);
      await clearPendingEmail();
      set({
        status: "authenticated",
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        pendingEmail: null,
        pendingOtpPurpose: null,
      });
    },

    updateTokens: async (tokens) => {
      await saveTokens(tokens);
      set({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    },

    setPendingVerification: async (email, purpose) => {
      await setPendingEmail(email);
      set({ pendingEmail: email, pendingOtpPurpose: purpose });
    },

    clearPendingVerification: async () => {
      await clearPendingEmail();
      set({ pendingEmail: null, pendingOtpPurpose: null });
    },

    signOut: async () => {
      await clearSession();
      set({
        status: "unauthenticated",
        user: null,
        accessToken: null,
        refreshToken: null,
      });
    },
  };
});
