export type AuthUser = {
  id: string;
  email: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  hasPassword: boolean;
  onboardingCompletedAt: string | null;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSession = {
  user: AuthUser;
  tokens: AuthTokens;
};

export type OtpPurpose = "register" | "password_reset";

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

/** Android sends a classic `accessToken`; iOS Limited Login sends an OIDC `authenticationToken`. */
export type FacebookSignInInput =
  | { accessToken: string }
  | { authenticationToken: string };
