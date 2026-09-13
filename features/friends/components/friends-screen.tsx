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
  const incomingRequests = useFriendRequestsQuery("incoming");
  const hasIncomingRequests =
    (incomingRequests.data?.pages[0]?.items.length ?? 0) > 0;

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
            {t.key === "incoming" && hasIncomingRequests ? (
              <View style={styles.tabBadgeDot} />
            ) : null}
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
                  style={styles.acceptBtn}
                  accessibilityLabel="Accept request"
                >
                  <Text style={styles.acceptBtnText}>✓</Text>
                </Pressable>
                <Pressable
                  onPress={() => decline.mutate(item.id)}
                  style={styles.declineBtn}
                  accessibilityLabel="Decline request"
                >
                  <Text style={styles.declineBtnText}>✕</Text>
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
  safe: { flex: 1, backgroundColor: BrandColors.paper },
  headerActions: { flexDirection: "row", gap: 18 },
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 2.5,
    borderColor: BrandColors.ink,
    backgroundColor: BrandColors.paper,
  },
  tabActive: {
    backgroundColor: BrandColors.primaryLight,
    shadowColor: BrandColors.ink,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  tabLabel: { color: BrandColors.inkMuted, fontWeight: "600", fontSize: 13 },
  tabLabelActive: { color: BrandColors.ink },
  tabBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.accentPink,
    borderWidth: 1.5,
    borderColor: BrandColors.ink,
  },
  list: { paddingHorizontal: 16, paddingBottom: 40, flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyText: { color: BrandColors.inkMuted, fontSize: 14, textAlign: "center" },
  rowActions: { flexDirection: "row", gap: 8 },
  acceptBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: BrandColors.ink,
    backgroundColor: BrandColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtnText: { color: BrandColors.ink, fontWeight: "700", fontSize: 14 },
  declineBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: BrandColors.ink,
    backgroundColor: "#FFB3B3",
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtnText: { color: BrandColors.ink, fontWeight: "700", fontSize: 14 },
  secondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: BrandColors.ink,
    backgroundColor: BrandColors.paper,
  },
  secondaryBtnText: {
    color: BrandColors.ink,
    fontWeight: "600",
    fontSize: 13,
  },
});
