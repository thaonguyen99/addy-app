import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { BrandColors } from "@/constants/theme";
import type { PublicUser } from "@/types/api";

export function userDisplayName(user: PublicUser): string {
  return user.name ?? user.username ?? "Addy user";
}

export function UserAvatar({
  user,
  size = 40,
}: {
  user: PublicUser;
  size?: number;
}) {
  const initial = userDisplayName(user).charAt(0).toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      {user.avatarUrl ? (
        <Image
          source={{ uri: user.avatarUrl }}
          style={styles.avatarImage}
          contentFit="cover"
        />
      ) : (
        <Text style={[styles.avatarInitial, { fontSize: size * 0.4 }]}>
          {initial}
        </Text>
      )}
    </View>
  );
}

export function UserRow({
  user,
  subtitle,
  right,
}: {
  user: PublicUser;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <UserAvatar user={user} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {userDisplayName(user)}
        </Text>
        {user.username ? (
          <Text style={styles.handle} numberOfLines={1}>
            @{user.username}
            {subtitle ? ` · ${subtitle}` : ""}
          </Text>
        ) : subtitle ? (
          <Text style={styles.handle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  avatar: {
    backgroundColor: BrandColors.elevated,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitial: { fontWeight: "700", color: BrandColors.neutral },
  text: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: "600", color: BrandColors.neutral },
  handle: { fontSize: 13, color: BrandColors.neutralMuted },
  right: { marginLeft: "auto" },
});
