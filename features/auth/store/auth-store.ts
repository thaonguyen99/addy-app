import { create } from "zustand";

import {
  configureApiClient,
  RefreshRejectedError,
  refreshSession,
} from "@/lib/api/client";
import { signOutGoogle } from "@/features/auth/google/google-sign-in";
import {
  getCurrentPushToken,
  resetPushRegistrationCache,
} from "@/features/notifications/push-registration";
import { deleteDeviceToken } from "@/lib/api/notifications";
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
  updateUser: (partial: Partial<AuthUser>) => Promise<void>;
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

  /**
   * Confirm a session restored from storage is still good. Runs in the
   * background after hydrate() has already let the user into the app, so a
   * cold-starting API never blocks the splash. Only a genuine rejection from
   * the server ends the session; a network error / timeout is left alone and
   * retried later by the 401 interceptor.
   */
  async function verifyRestoredSession() {
    try {
      await refreshSession();
    } catch (error) {
      if (error instanceof RefreshRejectedError) {
        await get().signOut();
      }
    }
  }

  return {
    status: "idle",
    user: null,
    accessToken: null,
    refreshToken: null,
    pendingEmail: null,
    pendingOtpPurpose: null,

    hydrate: async () => {
      set({ status: "hydrating" });
      try {
        const [stored, pendingEmail] = await Promise.all([
          loadStoredSession(),
          getPendingEmail(),
        ]);

        if (stored.user && stored.tokens) {
          console.log("[auth] restored stored session for", stored.user.email);
          // Trust storage so the app opens straight to the tabs, then verify
          // (and rotate) the tokens in the background.
          set({
            status: "authenticated",
            user: stored.user,
            accessToken: stored.tokens.accessToken,
            refreshToken: stored.tokens.refreshToken,
            pendingEmail: pendingEmail ?? null,
          });
          void verifyRestoredSession();
          return;
        }

        console.log("[auth] no stored session — showing sign-in");
        set({
          status: "unauthenticated",
          user: null,
          accessToken: null,
          refreshToken: null,
          pendingEmail: pendingEmail ?? null,
        });
      } catch (error) {
        console.error("[auth] hydrate failed", error);
        set({
          status: "unauthenticated",
          user: null,
          accessToken: null,
          refreshToken: null,
          pendingEmail: null,
        });
      }
    },

    setSession: async ({ user, tokens }) => {
      // Flip to authenticated first so navigation happens even if the keychain
      // write below hiccups — otherwise a storage error strands the user on
      // the sign-in screen right after a successful login.
      set({
        status: "authenticated",
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        pendingEmail: null,
        pendingOtpPurpose: null,
      });
      try {
        await saveSession(user, tokens);
        await clearPendingEmail();
      } catch (error) {
        console.error("[auth] could not persist session", error);
      }
    },

    updateUser: async (partial) => {
      const current = get().user;
      if (!current) return;
      const user = { ...current, ...partial };
      set({ user });
      const tokens = {
        accessToken: get().accessToken ?? "",
        refreshToken: get().refreshToken ?? "",
      };
      try {
        await saveSession(user, tokens);
      } catch (error) {
        console.error("[auth] could not persist updated user", error);
      }
    },

    updateTokens: async (tokens) => {
      set({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
      try {
        await saveTokens(tokens);
      } catch (error) {
        console.error("[auth] could not persist refreshed tokens", error);
      }
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
      // Unregister this device's push token while the session is still valid
      // (best-effort, time-boxed so it never stalls sign-out).
      try {
        const token = await Promise.race([
          getCurrentPushToken(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
        ]);
        if (token) await deleteDeviceToken(token);
      } catch {
        // ignore — the backend also prunes dead tokens on send
      }
      resetPushRegistrationCache();

      // Drop the in-memory session unconditionally, then best-effort clear
      // everything else — a failure here must never leave a half-signed-out app.
      set({
        status: "unauthenticated",
        user: null,
        accessToken: null,
        refreshToken: null,
        pendingEmail: null,
        pendingOtpPurpose: null,
      });
      await Promise.allSettled([clearSession(), signOutGoogle()]);
    },
  };
});
