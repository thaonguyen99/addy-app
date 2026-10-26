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
import { SkyBackground } from "@/components/ui/sky-background";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";
import { AuthTextField } from "@/features/auth/components/auth-text-field";
import { ProfileSubHeader } from "@/features/profile/components/profile-sub-header";
import { useAvatarUpload } from "@/hooks/use-avatar-upload";
import {
  type ProfileForm,
  USERNAME_PATTERN,
  profileFormSchema,
} from "@/features/profile/schema";
import { getApiErrorMessage } from "@/services/api/errors";
import { useCheckUsernameMutation, useProfileQuery, useUpdateProfileMutation } from "@/services/users";
import { safeBack } from "@/lib/safe-router";
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
    <SkyBackground>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ProfileSubHeader title="Account" />

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={AddyColors.ink} size="large" />
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
                      <ActivityIndicator color={AddyColors.ink} />
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
                      placeholderTextColor={AddyColors.inkMuted}
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
    </SkyBackground>
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
  safe: { flex: 1 },
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  muted: {
    fontFamily: AddyFonts.body,
    fontSize: 14,
    color: AddyColors.inkMuted,
    textAlign: "center",
  },
  retry: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: AddyRadius.pill,
    backgroundColor: AddyColors.white,
  },
  retryText: { fontFamily: AddyFonts.title, color: AddyColors.ink },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  avatarRow: {
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: AddyColors.white,
    backgroundColor: AddyColors.paperDim,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    ...AddyShadow.soft,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 48,
  },
  avatarInitial: {
    fontFamily: AddyFonts.title,
    fontSize: 38,
    color: AddyColors.ink,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(199, 242, 58, 0.4)",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AddyColors.lime,
    borderWidth: 2,
    borderColor: AddyColors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEditGlyph: {
    fontSize: 13,
  },
  changePhoto: {
    fontFamily: AddyFonts.titleSemiBold,
    fontSize: 14,
    color: AddyColors.ink,
  },
  email: {
    fontFamily: AddyFonts.body,
    fontSize: 13,
    color: AddyColors.inkMuted,
  },
  field: { gap: 6 },
  label: {
    fontFamily: AddyFonts.titleSemiBold,
    fontSize: 14,
    color: AddyColors.inkMuted,
  },
  bioInput: {
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    borderRadius: AddyRadius.input,
    backgroundColor: AddyColors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: AddyFonts.body,
    fontSize: 15,
    color: AddyColors.ink,
    minHeight: 88,
    textAlignVertical: "top",
  },
  errorText: { fontFamily: AddyFonts.body, fontSize: 13, color: AddyColors.danger },
});
