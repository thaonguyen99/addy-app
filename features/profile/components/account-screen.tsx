import { zodResolver } from "@hookform/resolvers/zod";
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

import { GlossyButton } from "@/components/ui/glossy-button";
import { BrandColors } from "@/constants/theme";
import { AuthTextField } from "@/features/auth/components/auth-text-field";
import { ProfileSubHeader } from "@/features/profile/components/profile-sub-header";
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
import { Image } from "expo-image";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export function AccountScreen() {
  const { data: profile, isLoading, isError, refetch } = useProfileQuery();
  const updateProfile = useUpdateProfileMutation();
  const { mutateAsync: checkUsernameAvailable } = useCheckUsernameMutation();
  const { pickAndUpload, busy: avatarBusy } = useAvatarUpload();

  const [saveError, setSaveError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");

  const initial = useMemo(() => {
    const source =
      profile?.name || profile?.username || profile?.email || "?";
    return source.charAt(0).toUpperCase();
  }, [profile?.name, profile?.username, profile?.email]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: "", username: "", bio: "" },
  });

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name ?? "",
        username: profile.username,
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
    if (values.name !== (profile?.name ?? "")) {
      payload.name = values.name || null;
    }
    if (values.username !== currentUsername) {
      payload.username = values.username;
    }
    if (values.bio !== (profile?.bio ?? "")) {
      payload.bio = values.bio || null;
    }

    if (Object.keys(payload).length === 0) {
      safeBack("/(app)/profile");
      return;
    }

    if (usernameStatus === "taken" || usernameStatus === "invalid") {
      setSaveError("Pick a different username before saving.");
      return;
    }

    try {
      await updateProfile.mutateAsync(payload);
      safeBack("/(app)/profile");
    } catch (error) {
      setSaveError(getApiErrorMessage(error, "Could not save your profile."));
    }
  });

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ProfileSubHeader title="Account" />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={BrandColors.primary} size="large" />
        </View>
      ) : isError || !profile ? (
        <View style={styles.center}>
          <Text style={styles.muted}>Could not load your profile.</Text>
          <Pressable style={styles.retry} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
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
                    <ActivityIndicator color={BrandColors.ink} />
                  </View>
                ) : null}
                <View style={styles.avatarEditBadge}>
                  <Text style={styles.avatarEditGlyph}>✏️</Text>
                </View>
              </Pressable>
              <Pressable onPress={pickAndUpload} disabled={avatarBusy}>
                <Text style={styles.changePhoto}>Change photo</Text>
              </Pressable>
              <Text style={styles.email}>{profile.email}</Text>
            </View>

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <AuthTextField
                  label="Name"
                  placeholder="Your name"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.name?.message}
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
                    placeholderTextColor={BrandColors.inkMuted}
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

            <GlossyButton
              label={updateProfile.isPending ? "Saving…" : "Save changes"}
              loading={updateProfile.isPending}
              onPress={onSubmit}
            />
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
  safe: { flex: 1, backgroundColor: BrandColors.paper },
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  muted: {
    fontSize: 14,
    color: BrandColors.inkMuted,
    textAlign: "center",
  },
  retry: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: BrandColors.elevated,
  },
  retryText: { color: BrandColors.ink, fontWeight: "600" },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 8,
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
    borderWidth: 4,
    borderColor: BrandColors.ink,
    backgroundColor: BrandColors.paper,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    shadowColor: BrandColors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 44,
  },
  avatarInitial: {
    fontFamily: "Fredoka-Bold",
    fontSize: 36,
    color: BrandColors.ink,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 44,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BrandColors.primaryMuted,
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BrandColors.accentYellow,
    borderWidth: 2.5,
    borderColor: BrandColors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditGlyph: {
    fontSize: 12,
  },
  changePhoto: {
    fontSize: 14,
    fontWeight: "600",
    color: BrandColors.primary,
  },
  email: {
    fontSize: 13,
    color: BrandColors.inkMuted,
  },
  field: { gap: 6 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: BrandColors.inkMuted,
  },
  bioInput: {
    borderWidth: 1,
    borderColor: BrandColors.neutralBorder,
    borderRadius: 12,
    backgroundColor: BrandColors.placeHolder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: BrandColors.ink,
    minHeight: 88,
    textAlignVertical: "top",
  },
  errorText: { fontSize: 13, color: BrandColors.accentPink },
});
