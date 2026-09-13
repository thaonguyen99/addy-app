import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";

import { GlossyButton } from "@/components/ui/glossy-button";
import { BrandColors } from "@/constants/theme";
import { AuthTextField } from "@/features/auth/components/auth-text-field";
import {
  type ChangePasswordForm,
  changePasswordFormSchema,
} from "@/features/profile/schema";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useChangePasswordMutation } from "@/lib/query/hooks";

type ChangePasswordSectionProps = {
  /** False for Google-only accounts that never set a password. */
  hasPassword: boolean;
};

export function ChangePasswordSection({
  hasPassword,
}: ChangePasswordSectionProps) {
  const changePassword = useChangePasswordMutation();
  const [done, setDone] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setDone(false);
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      setDone(true);
    } catch (error) {
      Alert.alert(
        "Change password",
        getApiErrorMessage(error, "Could not change your password."),
      );
    }
  });

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Password</Text>

      {!hasPassword ? (
        <Text style={styles.note}>
          You signed in with Google, so there is no password to change.
        </Text>
      ) : (
        <>
          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthTextField
                label="Current password"
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.currentPassword?.message}
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
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.newPassword?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <AuthTextField
                label="Confirm new password"
                secureTextEntry
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.confirmPassword?.message}
              />
            )}
          />
          {done ? (
            <Text style={styles.success}>Password updated.</Text>
          ) : null}
          <GlossyButton
            label={changePassword.isPending ? "Updating…" : "Update password"}
            variant="secondary"
            loading={changePassword.isPending}
            onPress={onSubmit}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
    color: BrandColors.ink,
  },
  note: {
    fontSize: 14,
    color: BrandColors.inkMuted,
    lineHeight: 20,
  },
  success: {
    fontSize: 13,
    color: BrandColors.inkMuted,
  },
});
