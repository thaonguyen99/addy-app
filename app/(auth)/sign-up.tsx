import { zodResolver } from "@hookform/resolvers/zod";
import { Link, router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AuthPrimaryButton } from "@/features/auth/components/auth-primary-button";
import { AuthScreen } from "@/features/auth/components/auth-screen";
import { AuthTextField } from "@/features/auth/components/auth-text-field";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { getAuthErrorMessage } from "@/features/auth/hooks/use-auth-form-error";
import {
  signUpSchema,
  type SignUpForm,
} from "@/features/auth/schemas/auth-schemas";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { ApiClientError } from "@/lib/api/errors";
import { useCheckUsernameMutation, useRegisterMutation } from "@/lib/query/hooks";
import { BrandColors } from "@/constants/theme";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

function usernameHint(status: UsernameStatus): string | undefined {
  switch (status) {
    case "checking":
      return "Checking availability…";
    case "taken":
      return "That username is taken.";
    default:
      return undefined;
  }
}

export default function SignUpScreen() {
  const setPendingVerification = useAuthStore((s) => s.setPendingVerification);
  const registerMutation = useRegisterMutation();
  const { mutateAsync: checkUsernameAvailable } = useCheckUsernameMutation();

  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      username: "",
    },
  });

  // Debounced live availability check, mirroring the profile screen's.
  const usernameValue = watch("username");
  const latestUsernameRef = useRef(usernameValue);
  latestUsernameRef.current = usernameValue.trim().toLowerCase();

  useEffect(() => {
    const next = usernameValue.trim().toLowerCase();
    if (next === "") {
      setUsernameStatus("idle");
      return;
    }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const { available } = await checkUsernameAvailable(next);
        if (latestUsernameRef.current === next) {
          setUsernameStatus(available ? "available" : "taken");
        }
      } catch {
        setUsernameStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [usernameValue, checkUsernameAvailable]);

  const onSubmit = handleSubmit(async (values) => {
    if (usernameStatus === "taken") {
      Alert.alert("Sign up", "Pick a different username before continuing.");
      return;
    }

    try {
      await registerMutation.mutateAsync({
        email: values.email,
        password: values.password,
        username: values.username,
      });
      await setPendingVerification(values.email, "register");
      router.push("/verify-otp");
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "CONFLICT") {
        if (error.message.toLowerCase().includes("username")) {
          Alert.alert("Sign up", "That username was just taken. Try another.");
          return;
        }
        Alert.alert(
          "Account exists",
          "This email is already registered. Try signing in.",
          [{ text: "Sign in", onPress: () => router.replace("/sign-in") }]
        );
        return;
      }
      Alert.alert("Sign up", getAuthErrorMessage(error, "Could not sign up"));
    }
  });

  return (
    <AuthScreen
      title="Create your account"
      subtitle="Join Addy to capture honest memories tied to places."
      footer={
        <Text style={styles.footerText}>
          Already have an account?{" "}
          <Link href="/sign-in" style={styles.link}>
            Sign in
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
        name="username"
        render={({ field: { onChange, onBlur, value } }) => (
          <AuthTextField
            label="Username"
            autoCapitalize="none"
            autoCorrect={false}
            onBlur={onBlur}
            onChangeText={(text) => onChange(text.toLowerCase())}
            value={value}
            error={errors.username?.message ?? usernameHint(usernameStatus)}
          />
        )}
      />
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
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            error={errors.password?.message}
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
        label="Create account"
        loading={isSubmitting || registerMutation.isPending}
        onPress={onSubmit}
      />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: BrandColors.neutralBorder },
  dividerText: { color: BrandColors.neutralMuted, fontSize: 14 },
  footerText: { textAlign: "center", color: BrandColors.neutralMuted },
  link: { color: BrandColors.link, fontWeight: "600" },
});
