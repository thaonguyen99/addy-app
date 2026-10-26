import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";
import { cloudinaryThumb } from "@/lib/cloudinary-thumb";
import type { PublicUser } from "@/services/users";

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
          source={{ uri: cloudinaryThumb(user.avatarUrl, size) }}
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

/** Person row as a soft white card: avatar, name, @handle, trailing actions. */
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
    <View style={[styles.row, AddyShadow.soft]}>
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
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    borderRadius: AddyRadius.card,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  avatar: {
    backgroundColor: AddyColors.paperDim,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarInitial: { fontFamily: AddyFonts.title, color: AddyColors.ink },
  text: { flex: 1, gap: 1 },
  name: {
    fontFamily: AddyFonts.title,
    fontSize: 15,
    lineHeight: 21,
    color: AddyColors.ink,
  },
  handle: { fontFamily: AddyFonts.tech, fontSize: 16, color: AddyColors.inkMuted },
  right: { marginLeft: "auto" },
});
