import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
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
  useAcceptFriendRequestMutation,
  useBlockUserMutation,
  useCancelFriendRequestMutation,
  useDeclineFriendRequestMutation,
  useFriendRequestsQuery,
  useFriendsQuery,
  useUnfriendMutation,
} from "@/lib/query/hooks";
import type { PublicUser } from "@/types/api";

type Tab = "friends" | "incoming" | "outgoing";

const TABS: { key: Tab; label: string }[] = [
  { key: "friends", label: "Friends" },
  { key: "incoming", label: "Requests" },
  { key: "outgoing", label: "Sent" },
];

export function FriendsScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialTab: Tab =
    params.tab === "incoming" || params.tab === "outgoing"
      ? params.tab
      : "friends";
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Friends"
        right={
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push("/(app)/friends/scan")}
              hitSlop={10}
              accessibilityLabel="Scan invite QR"
            >
              <Ionicons
                name="scan-outline"
                size={22}
                color={BrandColors.primary}
              />
            </Pressable>
            <Pressable
              onPress={() => router.push("/(app)/friends/invite")}
              hitSlop={10}
              accessibilityLabel="My invite code"
            >
              <Ionicons
                name="qr-code-outline"
                size={22}
                color={BrandColors.primary}
              />
            </Pressable>
            <Pressable
              onPress={() => router.push("/(app)/friends/search")}
              hitSlop={10}
              accessibilityLabel="Search for friends"
            >
              <Ionicons
                name="person-add-outline"
                size={22}
                color={BrandColors.primary}
              />
            </Pressable>
          </View>
        }
      />

      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tab, tab === t.key && styles.tabActive]}
          >
            <Text
              style={[
                styles.tabLabel,
                tab === t.key && styles.tabLabelActive,
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === "friends" ? <FriendsList /> : <RequestsList direction={tab} />}
    </SafeAreaView>
  );
}

export function friendActionsAlert(
  user: PublicUser,
  actions: { onRemove?: () => void; onBlock: () => void },
) {
  const name = userDisplayName(user);
  const buttons: {
    text: string;
    style?: "cancel" | "destructive";
    onPress?: () => void;
  }[] = [{ text: "Cancel", style: "cancel" }];
  if (actions.onRemove) {
    buttons.push({ text: "Remove friend", onPress: actions.onRemove });
  }
  buttons.push({
    text: `Block ${name}`,
    style: "destructive",
    onPress: () =>
      Alert.alert(
        `Block ${name}?`,
        "They won't be able to send you requests or see your memories. Any friendship is removed.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Block", style: "destructive", onPress: actions.onBlock },
        ],
      ),
  });
  Alert.alert(name, undefined, buttons);
}

function FriendsList() {
  const query = useFriendsQuery();
  const unfriend = useUnfriendMutation();
  const block = useBlockUserMutation();
  const friends = query.data?.pages.flatMap((p) => p.items) ?? [];

  if (query.isLoading) return <Loading />;

  return (
    <FlatList
      data={friends}
      keyExtractor={(item) => item.user.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <UserRow
          user={item.user}
          right={
            <Pressable
              hitSlop={10}
              onPress={() =>
                friendActionsAlert(item.user, {
                  onRemove: () => unfriend.mutate(item.user.id),
                  onBlock: () => block.mutate(item.user.id),
                })
              }
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={20}
                color={BrandColors.neutralMuted}
              />
            </Pressable>
          }
        />
      )}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) {
          void query.fetchNextPage();
        }
      }}
      ListEmptyComponent={<Empty text="No friends yet. Add someone!" />}
    />
  );
}

function RequestsList({ direction }: { direction: "incoming" | "outgoing" }) {
  const query = useFriendRequestsQuery(direction);
  const accept = useAcceptFriendRequestMutation();
  const decline = useDeclineFriendRequestMutation();
  const cancel = useCancelFriendRequestMutation();
  const requests = query.data?.pages.flatMap((p) => p.items) ?? [];

  if (query.isLoading) return <Loading />;

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <UserRow
          user={item.user}
          right={
            direction === "incoming" ? (
              <View style={styles.rowActions}>
                <Pressable
                  onPress={() => accept.mutate(item.id)}
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Accept</Text>
                </Pressable>
                <Pressable
                  onPress={() => decline.mutate(item.id)}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>Decline</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => cancel.mutate(item.id)}
                style={styles.secondaryBtn}
              >
                <Text style={styles.secondaryBtnText}>Cancel</Text>
              </Pressable>
            )
          }
        />
      )}
      onEndReached={() => {
        if (query.hasNextPage && !query.isFetchingNextPage) {
          void query.fetchNextPage();
        }
      }}
      ListEmptyComponent={
        <Empty
          text={
            direction === "incoming"
              ? "No incoming requests."
              : "No pending sent requests."
          }
        />
      }
    />
  );
}

function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={BrandColors.primary} size="large" />
    </View>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <View style={styles.center}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.gray900 },
  headerActions: { flexDirection: "row", gap: 18 },
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: BrandColors.elevated,
  },
  tabActive: { backgroundColor: BrandColors.primary },
  tabLabel: { color: BrandColors.neutralMuted, fontWeight: "600", fontSize: 13 },
  tabLabelActive: { color: BrandColors.white },
  list: { paddingHorizontal: 16, paddingBottom: 40, flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyText: { color: BrandColors.neutralMuted, fontSize: 14, textAlign: "center" },
  rowActions: { flexDirection: "row", gap: 8 },
  primaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: BrandColors.primary,
  },
  primaryBtnText: { color: BrandColors.white, fontWeight: "600", fontSize: 13 },
  secondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: BrandColors.elevated,
  },
  secondaryBtnText: {
    color: BrandColors.neutral,
    fontWeight: "600",
    fontSize: 13,
  },
});
