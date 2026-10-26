import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { UserRow } from "@/components/ui/user-row";
import { StickerBorderWidth, StickerRadius } from "@/constants/sticker-style";
import { BrandColors } from "@/constants/theme";
import type { PublicUser } from "@/services/users";

const MAX_SUGGESTIONS = 20;

type MentionSuggestionsProps = {
  friends: PublicUser[];
  query: string;
  onPick: (user: PublicUser) => void;
};

/** Username prefix or name substring match, case-insensitive. */
export function matchesUserQuery(user: PublicUser, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    user.username.toLowerCase().startsWith(q) ||
    (user.name?.toLowerCase().includes(q) ?? false)
  );
}

/** Friends matching the `@query` being typed — tap one to tag them. */
export function MentionSuggestions({
  friends,
  query,
  onPick,
}: MentionSuggestionsProps) {
  const results = friends
    .filter((user) => matchesUserQuery(user, query))
    .slice(0, MAX_SUGGESTIONS);

  return (
    <ScrollView
      style={styles.list}
      keyboardShouldPersistTaps="always"
      nestedScrollEnabled
    >
      {results.length === 0 ? (
        <Text style={styles.empty}>
          {friends.length === 0
            ? "No friends can see this memory yet"
            : "No friends match"}
        </Text>
      ) : (
        results.map((user) => (
          <Pressable
            key={user.id}
            onPress={() => onPick(user)}
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Tag ${user.username}`}
          >
            <UserRow user={user} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    maxHeight: 200,
    borderWidth: StickerBorderWidth.thin,
    borderColor: BrandColors.ink,
    borderRadius: StickerRadius.button,
    backgroundColor: BrandColors.white,
  },
  item: { paddingHorizontal: 10 },
  itemPressed: { backgroundColor: BrandColors.gray100 },
  empty: {
    padding: 12,
    fontFamily: "BeVietnam-Regular",
    fontSize: 14,
    color: BrandColors.inkMuted,
  },
});
