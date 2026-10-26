import Ionicons from "@expo/vector-icons/Ionicons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { UserAvatar } from "@/components/ui/user-row";
import {
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
  BrandColors,
} from "@/constants/theme";
import type { PublicUser } from "@/services/users";

export const PROFILE_AVATAR_SIZE = 80;

/** Muted greys for a profile that isn't available. */
export const ProfileMuted = {
  text: "#6B6F82",
  subtle: "#8E92A3",
  avatarBg: "#D5D8E0",
  avatarIcon: "#B3B7C4",
};

/** Left button · @username · right button. Empty slots keep the title centered. */
export function ProfileTopRow({
  left,
  title,
  right,
  muted = false,
}: {
  left?: ReactNode;
  title: string;
  right?: ReactNode;
  muted?: boolean;
}) {
  return (
    <View style={styles.topRow}>
      <View style={styles.topSlot}>{left}</View>
      <Text
        style={[styles.handle, muted && { color: ProfileMuted.subtle }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View style={[styles.topSlot, styles.topSlotRight]}>{right}</View>
    </View>
  );
}

/** 80px avatar in a white ring; `null` is the generic grey silhouette. */
export function ProfileAvatar({ user }: { user: PublicUser | null }) {
  return (
    <View style={[styles.ring, AddyShadow.soft]}>
      {user ? (
        <UserAvatar user={user} size={PROFILE_AVATAR_SIZE} />
      ) : (
        <View style={styles.silhouette}>
          <Ionicons
            name="person"
            size={PROFILE_AVATAR_SIZE * 0.6}
            color={ProfileMuted.avatarIcon}
            style={styles.silhouetteIcon}
          />
        </View>
      )}
    </View>
  );
}

/** Avatar, display name and one line under it (bio, a link, or a status). */
export function ProfileIdentity({
  user,
  name,
  below,
  muted = false,
}: {
  user: PublicUser | null;
  name: string;
  below?: ReactNode;
  muted?: boolean;
}) {
  return (
    <View style={styles.identity}>
      <ProfileAvatar user={user} />
      <Text
        style={[styles.name, muted && { color: ProfileMuted.text }]}
        numberOfLines={1}
      >
        {name}
      </Text>
      {below}
    </View>
  );
}

export function ProfileBio({ text }: { text: string }) {
  return <Text style={styles.bio}>{text}</Text>;
}

/** "Your memories ········ map ›" */
export function ProfileSectionHeader({
  title,
  onPressMap,
}: {
  title: string;
  onPressMap?: () => void;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPressMap ? (
        <Pressable
          onPress={onPressMap}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Open the map"
        >
          <Text style={styles.sectionLink}>map ›</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/** Grey placeholder for the header while the profile loads. */
export function ProfileIdentitySkeleton() {
  return (
    <View style={styles.identity}>
      <View style={[styles.ring, AddyShadow.soft]}>
        <View style={[styles.silhouette, styles.skeletonFill]} />
      </View>
      <View style={[styles.skeletonBar, { width: 120, height: 22 }]} />
      <View style={[styles.skeletonBar, { width: 200, height: 14 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
  },
  topSlot: { width: 52, flexDirection: "row" },
  topSlotRight: { justifyContent: "flex-end" },
  handle: {
    flex: 1,
    textAlign: "center",
    fontFamily: AddyFonts.tech,
    fontSize: 22,
    color: AddyColors.inkMuted,
  },
  identity: { alignItems: "center", gap: 2 },
  ring: {
    padding: 3,
    borderRadius: PROFILE_AVATAR_SIZE,
    backgroundColor: AddyColors.white,
    marginBottom: 6,
  },
  silhouette: {
    width: PROFILE_AVATAR_SIZE,
    height: PROFILE_AVATAR_SIZE,
    borderRadius: PROFILE_AVATAR_SIZE / 2,
    backgroundColor: ProfileMuted.avatarBg,
    alignItems: "center",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  // Sit the shoulders on the bottom edge, like a generic profile picture.
  silhouetteIcon: { marginBottom: -PROFILE_AVATAR_SIZE * 0.08 },
  name: {
    fontFamily: AddyFonts.title,
    fontSize: 26,
    lineHeight: 34,
    color: AddyColors.ink,
    maxWidth: "86%",
  },
  bio: {
    fontFamily: AddyFonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: AddyColors.inkMuted,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: AddyFonts.title,
    fontSize: 18,
    lineHeight: 26,
    color: AddyColors.ink,
  },
  sectionLink: {
    fontFamily: AddyFonts.tech,
    fontSize: 20,
    color: BrandColors.link,
  },
  skeletonFill: { backgroundColor: AddyColors.paperDim },
  skeletonBar: {
    marginTop: 6,
    borderRadius: AddyRadius.chip,
    backgroundColor: "rgba(40, 44, 92, 0.08)",
  },
});
