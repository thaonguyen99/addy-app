import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StickerCard } from "@/components/ui/sticker-card";
import {
  StickerRadius,
  accentCyanDeep,
  accentPinkDeep,
  darkenHex,
} from "@/constants/sticker-style";
import { BrandColors } from "@/constants/theme";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useDeleteAccountMutation, useProfileQuery } from "@/lib/query/hooks";
import { safeBack } from "@/lib/navigation/safe-router";

const accentYellowDeep = darkenHex(BrandColors.accentYellow, 0.15);

type MenuItem = {
  key: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  sublabel: string;
  gradient: [string, string];
  onPress: () => void;
  disabled?: boolean;
  destructive?: boolean;
};

export function ProfileMenuScreen() {
  const { data: profile, isLoading, isError, refetch } = useProfileQuery();
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useDeleteAccountMutation();

  const initial =
    (profile?.name || profile?.username || profile?.email || "?")
      .charAt(0)
      .toUpperCase();

  const onSignOut = () => {
    void signOut().then(() => router.replace("/sign-in"));
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
            void deleteAccount
              .mutateAsync()
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
      sublabel: "username, name, avatar",
      gradient: [BrandColors.primaryLight, BrandColors.primary],
      onPress: () => router.push("/(app)/profile/account"),
    },
    {
      key: "security",
      icon: "lock",
      label: "Security",
      sublabel: "change password",
      gradient: [BrandColors.accentCyan, accentCyanDeep],
      onPress: () => router.push("/(app)/profile/security"),
    },
    {
      key: "notifications",
      icon: "notifications",
      label: "Notifications",
      sublabel: "alerts & reminders",
      gradient: [BrandColors.accentPink, accentPinkDeep],
      onPress: () => router.push("/(app)/profile/notifications"),
    },
    {
      key: "friends",
      icon: "people",
      label: "Friends",
      sublabel: "your connections",
      gradient: [BrandColors.accentYellow, accentYellowDeep],
      onPress: () => router.push("/(app)/friends"),
    },
    {
      key: "blocked",
      icon: "block",
      label: "Blocked accounts",
      sublabel: "manage blocked users",
      gradient: [BrandColors.primaryLight, BrandColors.primary],
      onPress: () => router.push("/(app)/blocked-accounts"),
    },
    {
      key: "privacy",
      icon: "privacy-tip",
      label: "Privacy Policy",
      sublabel: "how we use your data",
      gradient: [BrandColors.accentCyan, accentCyanDeep],
      onPress: () => router.push("/(app)/privacy-policy"),
    },
    {
      key: "delete",
      icon: "delete-forever",
      label: "Delete account",
      sublabel: "permanently erase everything",
      gradient: [BrandColors.dangerLight, BrandColors.danger],
      onPress: onDeleteAccount,
      disabled: deleteAccount.isPending,
      destructive: true,
    },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => safeBack("/(app)/(tabs)")}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
        >
          <Ionicons name="chevron-back" size={22} color={BrandColors.ink} />
          <Text style={styles.topBarTitle}>Profile</Text>
        </Pressable>
        <Pressable onPress={onSignOut} hitSlop={12}>
          <Text style={styles.signOutLink}>Sign out</Text>
        </Pressable>
      </View>

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
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
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
            </View>
            <Text style={styles.name}>{profile.name || profile.username}</Text>
            <Text style={styles.username}>@{profile.username}</Text>
          </View>

          <View style={styles.menuList}>
            {menuItems.map((item) => (
              <Pressable
                key={item.key}
                onPress={item.onPress}
                disabled={item.disabled}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={item.disabled && styles.menuRowDisabled}
              >
                <StickerCard radius={StickerRadius.button} shadowOffset={2}>
                  <View style={styles.menuRow}>
                    <View style={styles.iconBadgeShadow}>
                      <View style={styles.iconBadge}>
                        <View
                          style={[
                            StyleSheet.absoluteFillObject,
                            { backgroundColor: item.gradient[1] },
                          ]}
                        />
                        <MaterialIcons
                          name={item.icon}
                          size={18}
                          color={BrandColors.ink}
                        />
                      </View>
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
                      <Text style={styles.menuSublabel}>{item.sublabel}</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </StickerCard>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={onSignOut} style={styles.signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.paper },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  topBarTitle: {
    fontFamily: "Fredoka-Bold",
    fontSize: 20,
    color: BrandColors.ink,
  },
  signOutLink: {
    fontSize: 15,
    color: BrandColors.inkMuted,
    fontWeight: "600",
  },
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
    paddingTop: 12,
    paddingBottom: 40,
    gap: 22,
  },
  avatarWrap: {
    alignItems: "center",
    gap: 2,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: BrandColors.ink,
    backgroundColor: BrandColors.paper,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: BrandColors.ink,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitial: {
    fontFamily: "Fredoka-Bold",
    fontSize: 32,
    color: BrandColors.ink,
  },
  name: {
    fontFamily: "Fredoka-SemiBold",
    fontSize: 17,
    color: BrandColors.ink,
    marginTop: 8,
  },
  username: {
    fontFamily: "VT323-Regular",
    fontSize: 15,
    color: BrandColors.inkMuted,
  },
  menuList: {
    gap: 10,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
  },
  iconBadgeShadow: {
    shadowColor: BrandColors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: BrandColors.ink,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  menuTextWrap: {
    flex: 1,
    gap: 1,
  },
  menuRowDisabled: {
    opacity: 0.5,
  },
  menuLabel: {
    fontFamily: "Fredoka-SemiBold",
    fontSize: 15,
    color: BrandColors.ink,
  },
  menuLabelDestructive: {
    color: BrandColors.danger,
  },
  menuSublabel: {
    fontFamily: "VT323-Regular",
    fontSize: 14,
    color: BrandColors.inkMuted,
  },
  chevron: {
    fontFamily: "VT323-Regular",
    fontSize: 22,
    color: BrandColors.gray300,
  },
  signOut: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
  signOutText: { color: BrandColors.inkMuted, fontSize: 15 },
});
