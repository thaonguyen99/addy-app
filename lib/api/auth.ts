import { apiPost } from "@/lib/api/client";
import type {
  AuthSession,
  AuthTokens,
  AuthUser,
  OtpPurpose,
} from "@/types/api";

export type RegisterInput = {
  email: string;
  password: string;
  username: string;
};

export type VerifyOtpInput = {
  email: string;
  code: string;
  purpose: OtpPurpose;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type ResendOtpInput = {
  email: string;
  purpose: OtpPurpose;
};

export type ForgotPasswordInput = {
  email: string;
};

export type ResetPasswordInput = {
  email: string;
  code: string;
  newPassword: string;
};

export type GoogleSignInInput = {
  idToken: string;
};

export async function register(input: RegisterInput) {
  return apiPost<{ email: string; message: string }>("/auth/register", input);
}

export async function verifyOtp(input: VerifyOtpInput) {
  return apiPost<AuthSession>("/auth/verify-otp", input);
}

export async function resendOtp(input: ResendOtpInput) {
  return apiPost<{ message: string }>("/auth/resend-otp", input);
}

export async function login(input: LoginInput) {
  return apiPost<AuthSession>("/auth/login", input);
}

export async function forgotPassword(input: ForgotPasswordInput) {
  return apiPost<{ message: string }>("/auth/forgot-password", input);
}

export async function resetPassword(input: ResetPasswordInput) {
  return apiPost<{ message: string }>("/auth/reset-password", input);
}

export async function googleSignIn(input: GoogleSignInInput) {
  return apiPost<AuthSession>("/auth/google", input);
}

export async function refreshTokens(refreshToken: string) {
  return apiPost<AuthTokens>("/auth/refresh", { refreshToken });
}

export type { AuthUser, AuthTokens, AuthSession };
