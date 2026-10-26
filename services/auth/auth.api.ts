import { apiPost } from "../api/client";
import type {
  AuthSession,
  AuthTokens,
  ForgotPasswordInput,
  GoogleSignInInput,
  LoginInput,
  RegisterInput,
  ResendOtpInput,
  ResetPasswordInput,
  VerifyOtpInput,
} from "./auth.type";

async function register(input: RegisterInput) {
  return apiPost<{ email: string; message: string }>("/auth/register", input);
}

async function verifyOtp(input: VerifyOtpInput) {
  return apiPost<AuthSession>("/auth/verify-otp", input);
}

async function resendOtp(input: ResendOtpInput) {
  return apiPost<{ message: string }>("/auth/resend-otp", input);
}

async function login(input: LoginInput) {
  return apiPost<AuthSession>("/auth/login", input);
}

async function forgotPassword(input: ForgotPasswordInput) {
  return apiPost<{ message: string }>("/auth/forgot-password", input);
}

async function resetPassword(input: ResetPasswordInput) {
  return apiPost<{ message: string }>("/auth/reset-password", input);
}

async function googleSignIn(input: GoogleSignInInput) {
  return apiPost<AuthSession>("/auth/google", input);
}

async function refreshTokens(refreshToken: string) {
  return apiPost<AuthTokens>("/auth/refresh", { refreshToken });
}

export const authApi = {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  resetPassword,
  googleSignIn,
  refreshTokens,
};
