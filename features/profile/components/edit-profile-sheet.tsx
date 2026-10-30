import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type TextInputProps,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
} from "@/constants/theme";
import { ProfileAvatar } from "@/features/profile/components/profile-header";
import {
  BIO_MAX,
  BIO_TOO_LONG,
  type ProfileForm,
  profileFormSchema,
} from "@/features/profile/schema";
import {
  usernameHint,
  useUsernameStatus,
} from "@/features/profile/use-username-status";
import { type UploadedAvatar, useAvatarUpload } from "@/hooks/use-avatar-upload";
import { getApiErrorMessage } from "@/services/api/errors";
import { type UpdateProfileInput, useUpdateProfileMutation } from "@/services/users";
import { useAuthStore } from "@/stores/auth.store";
import { useEditProfileStore } from "@/stores/edit-profile.store";
import { showToast } from "@/stores/toast.store";
import { graphemeLength } from "@/utils/grapheme-length";

/** Name, username, avatar and bio. Opens over any signed-in screen. */
export function EditProfileSheet() {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const open = useEditProfileStore((s) => s.open);
  const setOpen = useEditProfileStore((s) => s.setOpen);
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfileMutation();
  const { pickAvatar, busy: avatarBusy } = useAvatarUpload();
  const [newAvatar, setNewAvatar] = useState<UploadedAvatar | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: "", username: "", bio: "" },
  });

  const currentUsername = user?.username ?? "";
  const usernameStatus = useUsernameStatus(watch("username"), currentUsername);
  const bioLength = graphemeLength(watch("bio"));
  const bioTooLong = bioLength > BIO_MAX;

  useEffect(() => {
    if (!open || !user) return;
    reset({
      name: user.name ?? "",
      username: user.username,
      bio: user.bio ?? "",
    });
    setNewAvatar(null);
    setSaveError(null);
    sheetRef.current?.present();
    // Only when it opens: a save updating `user` mustn't reset the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = useCallback(() => sheetRef.current?.dismiss(), []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  const changed = isDirty || newAvatar !== null;
  const usernameBlocked =
    usernameStatus === "taken" ||
    usernameStatus === "invalid" ||
    usernameStatus === "checking";
  const canSave =
    changed &&
    !usernameBlocked &&
    !bioTooLong &&
    !avatarBusy &&
    !updateProfile.isPending;

  const changeAvatar = async () => {
    const uploaded = await pickAvatar();
    if (uploaded) setNewAvatar(uploaded);
  };

  const onSave = handleSubmit(async (values) => {
    if (!user) return;
    setSaveError(null);
    const payload: UpdateProfileInput = {};
    if (values.name !== (user.name ?? "")) payload.name = values.name || null;
    if (values.username !== currentUsername) payload.username = values.username;
    if (values.bio !== (user.bio ?? "")) payload.bio = values.bio || null;
    if (newAvatar) Object.assign(payload, newAvatar);

    if (Object.keys(payload).length === 0) {
      close();
      return;
    }
    try {
      await updateProfile.mutateAsync(payload);
      close();
      showToast("Profile saved");
    } catch (error) {
      setSaveError(getApiErrorMessage(error, "Could not save your profile."));
    }
  });

  const avatarUser = user
    ? {
        id: user.id,
        username: user.username,
        name: user.name,
        avatarUrl: newAvatar?.avatarUrl ?? user.avatarUrl,
      }
    : null;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["90%"]}
      enableDynamicSizing={false}
      enablePanDownToClose
      topInset={insets.top}
      keyboardBlurBehavior="restore"
      onDismiss={() => setOpen(false)}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
    >
      <View style={styles.titleRow}>
        <Pressable
          onPress={close}
          hitSlop={10}
          accessibilityRole="button"
          style={styles.titleSide}
        >
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Edit profile</Text>
        <View style={[styles.titleSide, styles.titleSideRight]}>
          <Pressable
            onPress={onSave}
            disabled={!canSave}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSave, busy: updateProfile.isPending }}
            style={({ pressed }) => [
              styles.save,
              !canSave && styles.saveDisabled,
              pressed && styles.pressed,
            ]}
          >
            {updateProfile.isPending ? (
              <ActivityIndicator color={AddyColors.ink} size="small" />
            ) : (
              <Text style={styles.saveText}>Save</Text>
            )}
          </Pressable>
        </View>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={changeAvatar}
          disabled={avatarBusy}
          accessibilityRole="button"
          accessibilityLabel="Change profile picture"
          style={styles.avatar}
        >
          <ProfileAvatar user={avatarUser} />
          {avatarBusy ? (
            <View style={styles.avatarBusy}>
              <ActivityIndicator color={AddyColors.ink} />
            </View>
          ) : null}
          <View style={styles.cameraBadge}>
            <Text style={styles.cameraGlyph}>📷</Text>
          </View>
        </Pressable>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <FieldCard label="Name" error={errors.name?.message}>
              <SheetInput
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Your name"
                accessibilityLabel="Name"
              />
            </FieldCard>
          )}
        />

        <Controller
          control={control}
          name="username"
          render={({ field: { onChange, onBlur, value } }) => (
            <FieldCard
              label="Username"
              error={errors.username?.message ?? usernameHint(usernameStatus)}
            >
              <View style={styles.usernameRow}>
                <Text style={styles.at}>@</Text>
                <SheetInput
                  value={value}
                  // Lowercased by the schema on save. Never rewrite the text
                  // while typing: it fights the Android keyboard and garbles
                  // the input.
                  onBlur={onBlur}
                  onChangeText={onChange}
                  placeholder="username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel="Username"
                  style={styles.flex}
                />
              </View>
            </FieldCard>
          )}
        />

        <Controller
          control={control}
          name="bio"
          render={({ field: { onChange, onBlur, value } }) => (
            <FieldCard
              label="Bio"
              counter={`${bioLength}/${BIO_MAX}`}
              error={errors.bio?.message ?? (bioTooLong ? BIO_TOO_LONG : undefined)}
            >
              <SheetInput
                value={value}
                onBlur={onBlur}
                // Over the limit shows an error instead of cutting the text:
                // rewriting it while typing fights the Android keyboard.
                onChangeText={onChange}
                placeholder="A short line about your memories"
                multiline
                accessibilityLabel="Bio"
                style={styles.bio}
              />
            </FieldCard>
          )}
        />

        {saveError ? <Text style={styles.error}>{saveError}</Text> : null}

        <Text style={styles.note}>
          Everyone can see your name, avatar and bio, even people you&apos;re
          not friends with.
        </Text>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

function FieldCard({
  label,
  counter,
  error,
  children,
}: {
  label: string;
  counter?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.fieldWrap}>
      <View style={[styles.field, error && styles.fieldError]}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {counter ? <Text style={styles.label}>{counter}</Text> : null}
        </View>
        {children}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function SheetInput({ style, ...props }: TextInputProps) {
  return (
    <BottomSheetTextInput
      placeholderTextColor={AddyColors.inkMuted}
      style={[styles.input, style]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: AddyColors.paper },
  handleIndicator: { backgroundColor: AddyColors.line, width: 40 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  titleSide: { width: 76 },
  titleSideRight: { alignItems: "flex-end" },
  cancel: { fontFamily: AddyFonts.body, fontSize: 16, color: AddyColors.inkMuted },
  title: {
    flex: 1,
    textAlign: "center",
    fontFamily: AddyFonts.title,
    fontSize: 20,
    lineHeight: 28,
    color: AddyColors.ink,
  },
  save: {
    minWidth: 64,
    minHeight: 34,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: AddyRadius.pill,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.limeDeep,
    backgroundColor: AddyColors.lime,
  },
  saveDisabled: { opacity: 0.45 },
  saveText: { fontFamily: AddyFonts.title, fontSize: 16, color: AddyColors.ink },
  pressed: { opacity: 0.8 },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  avatar: { alignSelf: "center", marginBottom: 18 },
  avatarBusy: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: AddyColors.white,
    backgroundColor: AddyColors.yellow,
  },
  cameraGlyph: { fontSize: 14 },
  fieldWrap: { gap: 4 },
  field: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: AddyRadius.card,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  fieldError: { borderColor: AddyColors.danger },
  labelRow: { flexDirection: "row", justifyContent: "space-between" },
  label: { fontFamily: AddyFonts.tech, fontSize: 17, color: AddyColors.inkMuted },
  input: {
    paddingVertical: 4,
    fontFamily: AddyFonts.body,
    fontSize: 16,
    color: AddyColors.ink,
  },
  usernameRow: { flexDirection: "row", alignItems: "center" },
  at: { fontFamily: AddyFonts.body, fontSize: 16, color: AddyColors.ink },
  flex: { flex: 1 },
  // About five lines, then it scrolls.
  bio: { maxHeight: 120, textAlignVertical: "top" },
  error: { fontFamily: AddyFonts.body, fontSize: 13, color: AddyColors.danger },
  note: {
    marginTop: 18,
    paddingHorizontal: 8,
    fontFamily: AddyFonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: AddyColors.inkMuted,
    textAlign: "center",
  },
});
