import { StyleSheet, Text, View } from "react-native";

import { ChatAvatar } from "@/features/memory/chat-avatar";
import { AddyColors, AddyFonts } from "@/constants/theme";
import type { UserProfilePage } from "@/services/users";

const AVATAR_SIZE = 24;
const NAMED = 2;

/** "sekre_van, bendahara.k + 1 you know", with up to 3 stacked avatars. */
export function MutualFriendsLine({
  mutual,
}: {
  mutual: UserProfilePage["mutualFriends"];
}) {
  if (!mutual || mutual.count === 0) return null;

  const named = mutual.preview.slice(0, NAMED).map((u) => u.username);
  const rest = mutual.count - named.length;
  const text = `${named.join(", ")}${rest > 0 ? ` + ${rest}` : ""} you know`;

  return (
    <View style={styles.row} accessible accessibilityLabel={`Mutual friends: ${text}`}>
      <View style={styles.avatars}>
        {mutual.preview.slice(0, 3).map((user, i) => (
          <View key={user.id} style={[styles.avatar, i > 0 && styles.overlap]}>
            <ChatAvatar user={user} size={AVATAR_SIZE} />
          </View>
        ))}
      </View>
      <Text style={styles.text} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  avatars: { flexDirection: "row" },
  avatar: {
    borderRadius: AVATAR_SIZE,
    borderWidth: 1.5,
    borderColor: AddyColors.white,
  },
  overlap: { marginLeft: -8 },
  text: {
    flexShrink: 1,
    fontFamily: AddyFonts.tech,
    fontSize: 18,
    lineHeight: 20,
    color: AddyColors.inkMuted,
  },
});
