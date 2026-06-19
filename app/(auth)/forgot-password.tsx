import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Alert } from "react-native";

import { AuthPrimaryButton } from "@/features/auth/components/auth-primary-button";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { AuthTextField } from "@/features/auth/components/auth-text-field";
import { getAuthErrorMessage } from "@/features/auth/hooks/use-auth-form-error";
import {
  forgotPasswordSchema,
  type ForgotPasswordForm,
} from "@/features/auth/schemas/auth-schemas";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useForgotPasswordMutation } from "@/lib/query/hooks";

export default function ForgotPasswordScreen() {
  const setPendingVerification = useAuthStore((s) => s.setPendingVerification);
  const forgotMutation = useForgotPasswordMutation();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await forgotMutation.mutateAsync(values);
      await setPendingVerification(values.email, "password_reset");
      router.push("/reset-password");
    } catch (error) {
      Alert.alert(
        "Forgot password",
        getAuthErrorMessage(error, "Could not send reset code")
      );
    }
  });

  return (
    <AuthScreen
      title="Forgot password"
      subtitle="We'll email you a verification code if an account exists."
    >
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            label="Email"
            keyboardType="email-address"
            autoComplete="email"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.email?.message}
          />
        )}
      />
      <AuthPrimaryButton
        label="Send code"
        loading={isSubmitting || forgotMutation.isPending}
        onPress={onSubmit}
      />
      <AuthPrimaryButton
        label="Back to sign in"
        variant="secondary"
        onPress={() => router.back()}
      />
    </AuthScreen>
  );
}
