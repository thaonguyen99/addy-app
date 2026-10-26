import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ADDY_BORDER_WIDTH, AddyColors, AddyFonts } from "@/constants/theme";
import { cloudinaryThumb } from "@/lib/cloudinary-thumb";

type ChatAvatarProps = {
  /** Null when the author is hidden (they blocked the viewer). */
  user: { username: string; avatarUrl: string | null } | null;
  size?: number;
};

/** Round avatar for chat rows and the chat header. */
export const ChatAvatar = memo(function ChatAvatar({
  user,
  size = 30,
}: ChatAvatarProps) {
  const radius = { borderRadius: size / 2 };
  if (user?.avatarUrl) {
    // Photo edge to edge with the ring drawn over it: a border + background
    // behind a dark photo shows as light slivers at the rounded edge.
    return (
      <View style={[{ width: size, height: size }, radius]}>
        <Image
          source={{ uri: cloudinaryThumb(user.avatarUrl, size) }}
          style={[StyleSheet.absoluteFill, radius]}
          contentFit="cover"
        />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.ring, radius]} />
      </View>
    );
  }
  return (
    <View style={[styles.avatar, { width: size, height: size }, radius]}>
      {user ? (
        <Text style={[styles.initial, { fontSize: size * 0.42 }]}>
          {user.username.charAt(0).toUpperCase()}
        </Text>
      ) : (
        <Ionicons name="person" size={size * 0.46} color={AddyColors.inkMuted} />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  avatar: {
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.paperDim,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ring: { borderWidth: ADDY_BORDER_WIDTH, borderColor: AddyColors.line },
  initial: { fontFamily: AddyFonts.title, color: AddyColors.ink },
});
