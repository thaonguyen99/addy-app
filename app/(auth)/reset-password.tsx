import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Alert } from "react-native";

import { AuthPrimaryButton } from "@/features/auth/components/auth-primary-button";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { AuthTextField } from "@/features/auth/components/auth-text-field";
import { getAuthErrorMessage } from "@/features/auth/hooks/use-auth-form-error";
import {
  resetPasswordSchema,
  type ResetPasswordForm,
} from "@/features/auth/schemas/auth-schemas";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useResetPasswordMutation } from "@/lib/query/hooks";

export default function ResetPasswordScreen() {
  const pendingEmail = useAuthStore((s) => s.pendingEmail);
  const clearPendingVerification = useAuthStore((s) => s.clearPendingVerification);
  const resetMutation = useResetPasswordMutation();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: pendingEmail ?? "",
      code: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await resetMutation.mutateAsync({
        email: values.email,
        code: values.code,
        newPassword: values.newPassword,
      });
      await clearPendingVerification();
      Alert.alert("Password updated", "You can sign in with your new password.", [
        { text: "OK", onPress: () => router.replace("/sign-in") },
      ]);
    } catch (error) {
      Alert.alert(
        "Reset password",
        getAuthErrorMessage(error, "Could not reset password")
      );
    }
  });

  return (
    <AuthScreen
      title="Reset password"
      subtitle="Enter the code from your email and choose a new password."
    >
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            label="Email"
            keyboardType="email-address"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.email?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="code"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            label="Verification code"
            keyboardType="number-pad"
            maxLength={6}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.code?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="newPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            label="New password"
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.newPassword?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            label="Confirm password"
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.confirmPassword?.message}
          />
        )}
      />
      <AuthPrimaryButton
        label="Update password"
        loading={isSubmitting || resetMutation.isPending}
        onPress={onSubmit}
      />
    </AuthScreen>
  );
}
