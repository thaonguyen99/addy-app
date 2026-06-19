import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, StyleSheet, Text } from "react-native";

import { AuthPrimaryButton } from "@/features/auth/components/auth-primary-button";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { AuthTextField } from "@/features/auth/components/auth-text-field";
import { getAuthErrorMessage } from "@/features/auth/hooks/use-auth-form-error";
import {
  verifyOtpSchema,
  type VerifyOtpForm,
} from "@/features/auth/schemas/auth-schemas";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { useResendOtpMutation, useVerifyOtpMutation } from "@/lib/query/hooks";
import { BrandColors } from "@/constants/theme";

export default function VerifyOtpScreen() {
  const pendingEmail = useAuthStore((s) => s.pendingEmail);
  const pendingOtpPurpose = useAuthStore((s) => s.pendingOtpPurpose);
  const setSession = useAuthStore((s) => s.setSession);
  const verifyMutation = useVerifyOtpMutation();
  const resendMutation = useResendOtpMutation();

  const purpose = pendingOtpPurpose ?? "register";

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpForm>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { code: "" },
  });

  if (!pendingEmail) {
    return (
      <AuthScreen title="Verification" subtitle="No pending email found.">
        <AuthPrimaryButton
          label="Back to sign in"
          onPress={() => router.replace("/sign-in")}
        />
      </AuthScreen>
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const session = await verifyMutation.mutateAsync({
        email: pendingEmail,
        code: values.code,
        purpose,
      });
      await setSession(session);
    } catch (error) {
      Alert.alert(
        "Verification",
        getAuthErrorMessage(error, "Could not verify code")
      );
    }
  });

  const onResend = async () => {
    try {
      await resendMutation.mutateAsync({ email: pendingEmail, purpose });
      Alert.alert("Code sent", "Check your email for a new verification code.");
    } catch (error) {
      Alert.alert("Resend", getAuthErrorMessage(error, "Could not resend code"));
    }
  };

  return (
    <AuthScreen
      title="Verify your email"
      subtitle={`Enter the 6-digit code sent to ${pendingEmail}`}
    >
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
      <AuthPrimaryButton
        label="Verify"
        loading={isSubmitting || verifyMutation.isPending}
        onPress={onSubmit}
      />
      <Pressable onPress={onResend} disabled={resendMutation.isPending}>
        <Text style={styles.resend}>
          {resendMutation.isPending ? "Sending…" : "Resend code"}
        </Text>
      </Pressable>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  resend: {
    textAlign: "center",
    color: BrandColors.link,
    fontSize: 15,
    fontWeight: "500",
    marginTop: 4,
  },
});
