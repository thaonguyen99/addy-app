import { router } from "expo-router";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SkyBackground } from "@/components/ui/sky-background";
import { SUPPORT_EMAIL } from "@/constants/app-config";
import { AddyColors, AddyFonts } from "@/constants/theme";
import { ProfileSubHeader } from "@/features/profile/components/profile-sub-header";
import {
  SettingsRow,
  SettingsSectionTitle,
} from "@/features/profile/components/settings-row";
import { getApiErrorMessage } from "@/services/api/errors";
import { useBlockedUsersQuery } from "@/services/social";
import { useDeleteAccountMutation, useProfileQuery } from "@/services/users";
import { useAuthStore } from "@/stores/auth.store";
import { clearPinQueue, usePinQueueStore } from "@/stores/pin-queue.store";

/** "2 people", "1 person", "20+ people" — from the first page of blocks. */
function blockedSublabel(count: number | undefined, more: boolean): string {
  if (count === undefined) return "people you've blocked";
  if (count === 0) return "nobody";
  if (more) return `${count}+ people`;
  return count === 1 ? "1 person" : `${count} people`;
}

/**
 * Settings, opened from ⚙️ on your profile. Only things nobody else sees:
 * who you are (avatar, name, bio) lives on the profile's Edit sheet, and the
 * email is shown as sign-in info. Log out and Delete sit apart at the bottom.
 */
export function ProfileMenuScreen() {
  const { data: profile } = useProfileQuery();
  const storedEmail = useAuthStore((s) => s.user?.email);
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useDeleteAccountMutation();
  const blocked = useBlockedUsersQuery();
  const blockedFirstPage = blocked.data?.pages[0];

  const pendingPinCount = usePinQueueStore((s) => s.entries.length);

  const onSignOut = () => {
    const doSignOut = () => {
      void signOut().then(() => router.replace("/sign-in"));
    };
    if (pendingPinCount === 0) {
      doSignOut();
      return;
    }
    // Drafts stay on this phone, scoped to this account — they resume on the
    // next sign-in as this user and are never uploaded under anyone else.
    Alert.alert(
      "Memories not uploaded yet",
      `${pendingPinCount} ${pendingPinCount === 1 ? "memory is" : "memories are"} still waiting to upload. They'll finish uploading next time you sign in to this account.`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log out", style: "destructive", onPress: doSignOut },
      ],
    );
  };

  const onHelp = () => {
    const subject = encodeURIComponent("Addy: help & feedback");
    // No mail app configured (common on simulators) — show the address instead.
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`).catch(() => {
      Alert.alert("Help & feedback", `Email us at ${SUPPORT_EMAIL}`);
    });
  };

  const onDeleteAccount = () => {
    Alert.alert(
      "Delete account?",
      "This permanently deletes your account, memories, photos, and friend connections. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: () => {
            const userId = useAuthStore.getState().user?.id;
            void deleteAccount
              .mutateAsync()
              .then(() => (userId ? clearPinQueue(userId) : undefined))
              .then(() => signOut())
              .then(() => router.replace("/sign-in"))
              .catch((error) => {
                Alert.alert(
                  "Delete account",
                  getApiErrorMessage(error, "Could not delete your account."),
                );
              });
          },
        },
      ],
    );
  };

  return (
    <SkyBackground>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ProfileSubHeader title="Settings" fallback="/(app)/(tabs)" />
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <SettingsSectionTitle>Account</SettingsSectionTitle>
          <SettingsRow
            emoji="🔒"
            tone="cyan"
            label="Sign-in & security"
            sublabel={profile?.email ?? storedEmail ?? "password"}
            onPress={() => router.push("/(app)/profile/security")}
          />
          <SettingsRow
            emoji="🔔"
            tone="pink"
            label="Notifications"
            sublabel="alerts & reminders"
            onPress={() => router.push("/(app)/profile/notifications")}
          />
          <SettingsRow
            emoji="⛔"
            tone="lime"
            label="Blocked accounts"
            sublabel={blockedSublabel(
              blockedFirstPage?.items.length,
              Boolean(blockedFirstPage?.nextCursor),
            )}
            onPress={() => router.push("/(app)/blocked-accounts")}
          />

          <SettingsSectionTitle>Other</SettingsSectionTitle>
          <SettingsRow
            emoji="💬"
            tone="lime"
            label="Help & feedback"
            sublabel="report a problem"
            onPress={onHelp}
          />
          <SettingsRow
            emoji="📄"
            tone="yellow"
            label="Privacy policy"
            sublabel="how we use your data"
            onPress={() => router.push("/(app)/privacy-policy")}
          />

          <View style={styles.footer}>
            <Pressable
              onPress={onSignOut}
              hitSlop={8}
              accessibilityRole="button"
              style={({ pressed }) => [styles.footerButton, pressed && styles.pressed]}
            >
              <Text style={styles.logOut}>Log out</Text>
            </Pressable>
            <Pressable
              onPress={onDeleteAccount}
              disabled={deleteAccount.isPending}
              hitSlop={8}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.footerButton,
                (pressed || deleteAccount.isPending) && styles.pressed,
              ]}
            >
              <Text style={styles.delete}>Delete account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
    gap: 12,
  },
  footer: { alignItems: "center", gap: 4, marginTop: 20 },
  footerButton: { paddingVertical: 10, paddingHorizontal: 20 },
  pressed: { opacity: 0.6 },
  logOut: {
    fontFamily: AddyFonts.title,
    fontSize: 17,
    color: AddyColors.inkMuted,
  },
  delete: {
    fontFamily: AddyFonts.bodyMedium,
    fontSize: 16,
    color: "#D63A7A",
  },
});
