import { StyleSheet, View } from "react-native";

import { TechChip } from "@/components/ui/tech-chip";
import { UserAvatar, userDisplayName } from "@/components/ui/user-row";
import type { PublicUser } from "@/services/users";

type TaggedFriendsRowProps = {
  users: readonly PublicUser[];
  /** When set, each chip gets a "×" and a "+ tag friends" chip is shown. */
  onRemove?: (user: PublicUser) => void;
  onAdd?: () => void;
  onPressUser?: (user: PublicUser) => void;
};

/** Wrapping row of tagged-friend chips. */
export function TaggedFriendsRow({
  users,
  onRemove,
  onAdd,
  onPressUser,
}: TaggedFriendsRowProps) {
  return (
    <View style={styles.row}>
      {users.map((user) => (
        <TechChip
          key={user.id}
          size="sm"
          label={userDisplayName(user)}
          leading={<UserAvatar user={user} size={18} />}
          trailing={onRemove ? "×" : undefined}
          onPress={
            onRemove
              ? () => onRemove(user)
              : onPressUser
                ? () => onPressUser(user)
                : undefined
          }
          accessibilityLabel={
            onRemove ? `Untag ${userDisplayName(user)}` : userDisplayName(user)
          }
        />
      ))}
      {onAdd ? (
        <TechChip
          size="sm"
          tone="lime"
          label={users.length > 0 ? "+ edit tags" : "+ tag friends"}
          onPress={onAdd}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
});
