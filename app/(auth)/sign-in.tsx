import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { BrandColors } from "@/constants/theme";
import { AuthPrimaryButton } from "@/features/auth/components/auth-primary-button";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { AuthTextField } from "@/features/auth/components/auth-text-field";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { getAuthErrorMessage } from "@/features/auth/hooks/use-auth-form-error";
import {
  signInSchema,
  type SignInForm,
} from "@/features/auth/schemas/auth-schemas";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { ApiClientError } from "@/lib/api/errors";
import { useLoginMutation } from "@/lib/query/hooks";

export default function SignInScreen() {
  const setSession = useAuthStore((s) => s.setSession);
  const setPendingVerification = useAuthStore((s) => s.setPendingVerification);
  const loginMutation = useLoginMutation();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    console.log("🚀 ~ SignInScreen ~ values:", values);
    try {
      const session = await loginMutation.mutateAsync(values);
      console.log("🚀 ~ SignInScreen ~ session:", session);
      await setSession(session);
    } catch (error) {
      if (
        error instanceof ApiClientError &&
        error.code === "EMAIL_NOT_VERIFIED"
      ) {
        await setPendingVerification(values.email, "register");
        router.push("/verify-otp");
        return;
      }
      Alert.alert("Sign in", getAuthErrorMessage(error, "Could not sign in"));
    }
  });

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Sign in to save and revisit your place memories."
      footer={
        <Text style={styles.footerText}>
          New to Addy?{" "}
          <Link href="/sign-up" style={styles.link}>
            Create an account
          </Link>
        </Text>
      }
    >
      <GoogleSignInButton />
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.divider} />
      </View>
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
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            label="Password"
            secureTextEntry
            autoComplete="password"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.password?.message}
          />
        )}
      />
      <Pressable onPress={() => router.push("/forgot-password")}>
        <Text style={styles.forgot}>Forgot password?</Text>
      </Pressable>
      <AuthPrimaryButton
        label="Sign in"
        loading={isSubmitting || loginMutation.isPending}
        onPress={onSubmit}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: BrandColors.stroke2 },
  dividerText: { color: BrandColors.gray500, fontSize: 14 },
  forgot: {
    alignSelf: "flex-end",
    color: BrandColors.link,
    fontSize: 14,
    fontWeight: "500",
  },
  footerText: { textAlign: "center", color: BrandColors.gray600 },
  link: { color: BrandColors.link, fontWeight: "600" },
});
