import { useMutation } from "@tanstack/react-query";

import { authApi } from "./auth.api";

export function useRegisterMutation() {
  return useMutation({ mutationFn: authApi.register });
}

export function useVerifyOtpMutation() {
  return useMutation({ mutationFn: authApi.verifyOtp });
}

export function useResendOtpMutation() {
  return useMutation({ mutationFn: authApi.resendOtp });
}

export function useLoginMutation() {
  return useMutation({ mutationFn: authApi.login });
}

export function useForgotPasswordMutation() {
  return useMutation({ mutationFn: authApi.forgotPassword });
}

export function useResetPasswordMutation() {
  return useMutation({ mutationFn: authApi.resetPassword });
}

export function useGoogleSignInMutation() {
  return useMutation({ mutationFn: authApi.googleSignIn });
}

export function useFacebookSignInMutation() {
  return useMutation({ mutationFn: authApi.facebookSignIn });
}
