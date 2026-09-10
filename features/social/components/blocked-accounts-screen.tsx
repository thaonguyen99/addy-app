import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import { UserRow, userDisplayName } from "@/components/ui/user-row";
import { ScreenHeader } from "@/features/friends/components/screen-header";
import {
  useBlockedUsersQuery,
  useUnblockUserMutation,
} from "@/lib/query/hooks";
import type { BlockedUser } from "@/types/api";

export function BlockedAccountsScreen() {
  const query = useBlockedUsersQuery();
  const unblock = useUnblockUserMutation();
  const blocked: BlockedUser[] =
    query.data?.pages.flatMap((p) => p.items) ?? [];

  const confirmUnblock = (item: BlockedUser) => {
    Alert.alert(
      `Unblock ${userDisplayName(item.user)}?`,
      "They'll be able to find you and send a friend request again. This does not restore a previous friendship.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: () => unblock.mutate(item.user.id),
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title="Blocked accounts" fallback="/profile" />
      {query.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={BrandColors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={blocked}
          keyExtractor={(item) => item.user.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <UserRow
              user={item.user}
              right={
                <Pressable
                  onPress={() => confirmUnblock(item)}
                  style={styles.btn}
                >
                  <Text style={styles.btnText}>Unblock</Text>
                </Pressable>
              }
            />
          )}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>
              You haven&apos;t blocked anyone.
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.gray900 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 40, flexGrow: 1 },
  empty: {
    color: BrandColors.neutralMuted,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 40,
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: BrandColors.elevated,
  },
  btnText: { color: BrandColors.neutral, fontWeight: "600", fontSize: 13 },
});
