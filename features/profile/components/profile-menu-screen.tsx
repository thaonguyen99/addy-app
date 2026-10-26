import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconCircleButton } from "@/components/ui/icon-circle-button";
import { SkyBackground } from "@/components/ui/sky-background";
import { SUPPORT_EMAIL } from "@/constants/app-config";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";
import { useAuthStore } from "@/stores/auth.store";
import { openEditProfile } from "@/stores/edit-profile.store";
import { clearPinQueue, usePinQueueStore } from "@/stores/pin-queue.store";
import { getApiErrorMessage } from "@/services/api/errors";
import { safeBack } from "@/lib/safe-router";
import { useDeleteAccountMutation, useProfileQuery } from "@/services/users";

type MenuItem = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  sublabel: string;
  /** Orb color behind the icon. */
  color: string;
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

export function ProfileMenuScreen() {
  const { data: profile, isLoading, isError, refetch } = useProfileQuery();
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useDeleteAccountMutation();

  const initial = (profile?.name || profile?.username || profile?.email || "?")
    .charAt(0)
    .toUpperCase();

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
        { text: "Sign out", style: "destructive", onPress: doSignOut },
      ],
    );
  };

  const onContactUs = () => {
    // No mail app configured (common on simulators) — show the address instead.
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => {
      Alert.alert("Contact us", `Email us at ${SUPPORT_EMAIL}`);
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

  const menuItems: MenuItem[] = [
    {
      key: "account",
      icon: "person",
      label: "Account",
      sublabel: "name, username, avatar, bio",
      color: AddyColors.lime,
      onPress: () => openEditProfile(),
    },
    {
      key: "security",
      icon: "lock",
      label: "Security",
      sublabel: "change password",
      color: AddyColors.cyan,
      onPress: () => router.push("/(app)/profile/security"),
    },
    {
      key: "notifications",
      icon: "notifications",
      label: "Notifications",
      sublabel: "alerts & reminders",
      color: AddyColors.pink,
      onPress: () => router.push("/(app)/profile/notifications"),
    },
    {
      key: "friends",
      icon: "people",
      label: "Friends",
      sublabel: "your connections",
      color: AddyColors.yellow,
      onPress: () => router.navigate("/(app)/(tabs)/friends"),
    },
    {
      key: "blocked",
      icon: "block",
      label: "Blocked accounts",
      sublabel: "manage blocked users",
      color: AddyColors.lime,
      onPress: () => router.push("/(app)/blocked-accounts"),
    },
    {
      key: "privacy",
      icon: "privacy-tip",
      label: "Privacy Policy",
      sublabel: "how we use your data",
      color: AddyColors.cyan,
      onPress: () => router.push("/(app)/privacy-policy"),
    },
    {
      key: "contact",
      icon: "mail",
      label: "Contact us",
      sublabel: SUPPORT_EMAIL,
      color: AddyColors.yellow,
      onPress: onContactUs,
    },
    {
      key: "delete",
      icon: "delete-forever",
      label: "Delete account",
      sublabel: "permanently erase everything",
      color: AddyColors.danger,
      onPress: onDeleteAccount,
      disabled: deleteAccount.isPending,
      destructive: true,
    },
  ];

  return (
    <SkyBackground>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.topBar}>
          <IconCircleButton
            icon="chevron-back"
            accessibilityLabel="Back"
            onPress={() => safeBack("/(app)/(tabs)")}
          />
          <Text style={styles.topBarTitle}>Profile settings</Text>
        </View>

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
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.avatarWrap}>
              <Pressable
                onPress={() => openEditProfile()}
                accessibilityRole="button"
                accessibilityLabel="Edit your profile"
                style={[styles.avatar, AddyShadow.soft]}
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
                <View style={styles.editBadge}>
                  <MaterialIcons name="edit" size={15} color={AddyColors.ink} />
                </View>
              </Pressable>
              <Text style={styles.name}>{profile.name || profile.username}</Text>
              <Text style={styles.username}>@{profile.username}</Text>
              <Text style={styles.email}>{profile.email}</Text>
            </View>

            <View style={styles.menuList}>
              {menuItems.map((item) => (
                <Pressable
                  key={item.key}
                  onPress={item.onPress}
                  disabled={item.disabled}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  style={({ pressed }) => [
                    styles.menuRow,
                    AddyShadow.soft,
                    pressed && styles.pressed,
                    item.disabled && styles.menuRowDisabled,
                  ]}
                >
                  <View style={[styles.orb, { backgroundColor: item.color }]}>
                    <View style={styles.orbShine} />
                    <MaterialIcons
                      name={item.icon}
                      size={18}
                      color={item.destructive ? AddyColors.white : AddyColors.ink}
                    />
                  </View>
                  <View style={styles.menuTextWrap}>
                    <Text
                      style={[
                        styles.menuLabel,
                        item.destructive && styles.menuLabelDestructive,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.menuSublabel} numberOfLines={1}>
                      {item.sublabel}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={onSignOut}
              style={styles.signOut}
              accessibilityRole="button"
            >
              <Text style={styles.signOutText}>Sign out</Text>
            </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
    </SkyBackground>
  );
}

const ORB = 36;

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  topBarTitle: {
    fontFamily: AddyFonts.title,
    fontSize: 20,
    lineHeight: 30,
    color: AddyColors.ink,
  },
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
    gap: 22,
  },
  avatarWrap: { alignItems: "center", gap: 0 },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 4,
    borderColor: AddyColors.white,
    backgroundColor: AddyColors.paperDim,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: { width: "100%", height: "100%", borderRadius: 48 },
  avatarInitial: {
    fontFamily: AddyFonts.title,
    fontSize: 38,
    color: AddyColors.ink,
  },
  editBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AddyColors.lime,
    borderWidth: 2,
    borderColor: AddyColors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontFamily: AddyFonts.title,
    fontSize: 20,
    lineHeight: 30,
    color: AddyColors.ink,
    marginTop: 10,
  },
  username: {
    fontFamily: AddyFonts.tech,
    fontSize: 17,
    color: AddyColors.inkMuted,
  },
  email: {
    fontFamily: AddyFonts.body,
    fontSize: 13,
    color: AddyColors.inkMuted,
  },
  menuList: { gap: 10 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: AddyRadius.card,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  pressed: { opacity: 0.8 },
  menuRowDisabled: { opacity: 0.5 },
  orb: {
    width: ORB,
    height: ORB,
    borderRadius: ORB / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  // Glossy highlight, top-left — same light direction as GlossyOrb.
  orbShine: {
    position: "absolute",
    top: 3,
    left: 6,
    width: ORB * 0.5,
    height: ORB * 0.32,
    borderRadius: ORB,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },
  menuTextWrap: { flex: 1, gap: 1 },
  menuLabel: {
    fontFamily: AddyFonts.title,
    fontSize: 15,
    lineHeight: 21,
    color: AddyColors.ink,
  },
  menuLabelDestructive: { color: AddyColors.danger },
  menuSublabel: {
    fontFamily: AddyFonts.body,
    fontSize: 12,
    color: AddyColors.inkMuted,
  },
  chevron: {
    fontFamily: AddyFonts.tech,
    fontSize: 24,
    color: AddyColors.inkMuted,
  },
  signOut: { alignItems: "center", paddingVertical: 14, marginTop: 4 },
  signOutText: {
    fontFamily: AddyFonts.bodyMedium,
    color: AddyColors.inkMuted,
    fontSize: 15,
  },
});
