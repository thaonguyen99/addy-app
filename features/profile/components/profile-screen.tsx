import { zodResolver } from "@hookform/resolvers/zod";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import { AuthPrimaryButton } from "@/features/auth/components/auth-primary-button";
import { AuthTextField } from "@/features/auth/components/auth-text-field";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { ChangePasswordSection } from "@/features/profile/components/change-password-section";
import { useAvatarUpload } from "@/features/profile/hooks/use-avatar-upload";
import {
  type ProfileForm,
  USERNAME_PATTERN,
  profileFormSchema,
} from "@/features/profile/schema";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  useCheckUsernameMutation,
  useProfileQuery,
  useUpdateProfileMutation,
} from "@/lib/query/hooks";
import { safeBack } from "@/lib/navigation/safe-router";

type UsernameStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid";

export function ProfileScreen() {
  const { data: profile, isLoading } = useProfileQuery();
  const updateProfile = useUpdateProfileMutation();
  const { mutateAsync: checkUsernameAvailable } = useCheckUsernameMutation();
  const { pickAndUpload, busy: avatarBusy } = useAvatarUpload();
  const signOut = useAuthStore((s) => s.signOut);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");

  const initial = useMemo(() => {
    const source =
      profile?.displayName || profile?.username || profile?.email || "?";
    return source.charAt(0).toUpperCase();
  }, [profile?.displayName, profile?.username, profile?.email]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { displayName: "", username: "", bio: "" },
  });

  // Load server values into the form once the profile arrives.
  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName ?? "",
        username: profile.username ?? "",
        bio: profile.bio ?? "",
      });
    }
  }, [profile, reset]);

  const usernameValue = watch("username");
  const currentUsername = profile?.username ?? "";
  const latestUsernameRef = useRef(usernameValue);
  latestUsernameRef.current = usernameValue.trim().toLowerCase();

  useEffect(() => {
    const next = usernameValue.trim().toLowerCase();
    if (next === currentUsername || next === "") {
      setUsernameStatus("idle");
      return;
    }
    if (!USERNAME_PATTERN.test(next)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const { available } = await checkUsernameAvailable(next);
        // Guard against a stale response after further typing.
        if (latestUsernameRef.current === next) {
          setUsernameStatus(available ? "available" : "taken");
        }
      } catch {
        setUsernameStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [usernameValue, currentUsername, checkUsernameAvailable]);

  const onSubmit = handleSubmit(async (values) => {
    setSaveError(null);

    const payload: Parameters<typeof updateProfile.mutateAsync>[0] = {};
    if (values.displayName !== (profile?.displayName ?? "")) {
      payload.displayName = values.displayName || null;
    }
    if (values.username !== currentUsername) {
      payload.username = values.username || null;
    }
    if (values.bio !== (profile?.bio ?? "")) {
      payload.bio = values.bio || null;
    }

    if (Object.keys(payload).length === 0) {
      safeBack("/(app)/(tabs)");
      return;
    }

    if (usernameStatus === "taken" || usernameStatus === "invalid") {
      setSaveError("Pick a different username before saving.");
      return;
    }

    try {
      await updateProfile.mutateAsync(payload);
      safeBack("/(app)/(tabs)");
    } catch (error) {
      setSaveError(getApiErrorMessage(error, "Could not save your profile."));
    }
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => safeBack("/(app)/(tabs)")}
          hitSlop={12}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color={BrandColors.primary} />
          <Text style={styles.backLabel}>Profile</Text>
        </Pressable>
      </View>

      {isLoading || !profile ? (
        <View style={styles.center}>
          <ActivityIndicator color={BrandColors.primary} size="large" />
        </View>
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.avatarRow}>
              <Pressable
                onPress={pickAndUpload}
                disabled={avatarBusy}
                style={styles.avatar}
                accessibilityRole="button"
                accessibilityLabel="Change profile picture"
              >
                {profile.avatarUrl ? (
                  <Image
                    source={{ uri: profile.avatarUrl }}
                    style={styles.avatarImage}
                    contentFit="cover"
                    transition={150}
                  />
                ) : (
                  <Text style={styles.avatarInitial}>{initial}</Text>
                )}
                {avatarBusy ? (
                  <View style={styles.avatarOverlay}>
                    <ActivityIndicator color={BrandColors.neutral} />
                  </View>
                ) : null}
              </Pressable>
              <Pressable onPress={pickAndUpload} disabled={avatarBusy}>
                <Text style={styles.changePhoto}>Change photo</Text>
              </Pressable>
              <Text style={styles.email}>{profile.email}</Text>
            </View>

            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthTextField
                  label="Name"
                  placeholder="Your name"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.displayName?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthTextField
                  label="Username"
                  placeholder="username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={value}
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(text.toLowerCase())}
                  error={errors.username?.message ?? usernameHint(usernameStatus)}
                />
              )}
            />

            <View style={styles.field}>
              <Text style={styles.label}>Bio</Text>
              <Controller
                control={control}
                name="bio"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.bioInput}
                    placeholder="A short line about your memories"
                    placeholderTextColor={BrandColors.neutralMuted}
                    multiline
                    maxLength={300}
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                  />
                )}
              />
              {errors.bio?.message ? (
                <Text style={styles.errorText}>{errors.bio.message}</Text>
              ) : null}
            </View>

            {saveError ? (
              <Text style={styles.errorText}>{saveError}</Text>
            ) : null}

            <AuthPrimaryButton
              label="Save"
              loading={updateProfile.isPending}
              onPress={onSubmit}
            />

            <ChangePasswordSection hasPassword={profile.hasPassword} />

            <Pressable
              onPress={() => {
                void signOut().then(() => router.replace("/sign-in"));
              }}
              style={styles.signOut}
            >
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

function usernameHint(status: UsernameStatus): string | undefined {
  switch (status) {
    case "checking":
      return "Checking availability…";
    case "taken":
      return "That username is taken.";
    case "available":
      return undefined;
    case "invalid":
      return "Only lowercase letters, numbers, underscores and dots.";
    default:
      return undefined;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.gray900 },
  flex: { flex: 1 },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BrandColors.stroke2,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  backLabel: {
    fontSize: 17,
    color: BrandColors.neutral,
    fontWeight: "700",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 16,
  },
  avatarRow: {
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: BrandColors.elevated,
    borderWidth: 1,
    borderColor: BrandColors.neutralBorder,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitial: {
    fontSize: 36,
    fontWeight: "700",
    color: BrandColors.neutral,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BrandColors.primaryMuted,
  },
  changePhoto: {
    fontSize: 14,
    fontWeight: "600",
    color: BrandColors.primary,
  },
  email: {
    fontSize: 13,
    color: BrandColors.neutralMuted,
  },
  field: { gap: 6 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: BrandColors.neutralMuted,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: BrandColors.neutralBorder,
    borderRadius: 12,
    backgroundColor: BrandColors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: BrandColors.neutral,
    minHeight: 88,
    textAlignVertical: "top",
  },
  errorText: { fontSize: 13, color: BrandColors.primary },
  signOut: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
  signOutText: { color: BrandColors.neutralMuted, fontSize: 15 },
});
