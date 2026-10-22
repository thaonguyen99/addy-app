import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFloatingTabBarInset } from "@/components/navigation/floating-tab-bar";
import { GlossyOrb } from "@/components/ui/glossy-orb";
import { IconCircleButton } from "@/components/ui/icon-circle-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SkyBackground } from "@/components/ui/sky-background";
import { UserRow, userDisplayName } from "@/components/ui/user-row";
import { AddyColors, AddyFonts, AddyRadius } from "@/constants/theme";
import { MyQrCard } from "@/features/friends/components/my-qr-card";
import type { ReportSheetRef } from "@/features/reports/components/report-sheet";
import { ReportSheet } from "@/features/reports/components/report-sheet";
import {
  useAcceptFriendRequestMutation,
  useBlockUserMutation,
  useCancelFriendRequestMutation,
  useDeclineFriendRequestMutation,
  useFriendRequestsQuery,
  useFriendsQuery,
  useUnfriendMutation,
} from "@/lib/query/hooks";
import type { FriendRequest, PublicUser } from "@/types/api";

type Segment = "friends" | "qr" | "requests";

function segmentFromParam(tab: string | undefined): Segment {
  if (tab === "incoming" || tab === "outgoing" || tab === "requests") return "requests";
  if (tab === "qr") return "qr";
  return "friends";
}

export function FriendsScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const initialSegment = segmentFromParam(params.tab);
  const [segment, setSegment] = useState<Segment>(initialSegment);
  // The tab screen stays mounted, so a later deep link (?tab=incoming) has
  // to update the selection too.
  useEffect(() => {
    setSegment(initialSegment);
  }, [initialSegment]);

  const incoming = useFriendRequestsQuery("incoming");
  const incomingCount =
    incoming.data?.pages.reduce((sum, page) => sum + page.items.length, 0) ?? 0;

  const options = useMemo(
    () =>
      [
        { value: "friends", label: "Friends" },
        { value: "qr", label: "My QR" },
        {
          value: "requests",
          label: incomingCount > 0 ? `Requests (${incomingCount})` : "Requests",
        },
      ] as const,
    [incomingCount],
  );

  return (
    <SkyBackground>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Friends</Text>
          <IconCircleButton
            icon="scan-outline"
            size={36}
            accessibilityLabel="Scan invite QR"
            onPress={() => router.push("/(app)/friends/scan")}
          />
          <IconCircleButton
            icon="person-add-outline"
            size={36}
            accessibilityLabel="Find friends by username"
            onPress={() => router.push("/(app)/friends/add")}
          />
        </View>

        <SegmentedControl
          options={options}
          value={segment}
          onChange={setSegment}
          style={styles.segments}
        />

        {segment === "friends" ? (
          <FriendsList />
        ) : segment === "qr" ? (
          <QrSegment />
        ) : (
          <RequestsList />
        )}
      </SafeAreaView>
    </SkyBackground>
  );
}

export function friendActionsAlert(
  user: PublicUser,
  actions: { onRemove?: () => void; onBlock: () => void; onReport: () => void },
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
  buttons.push({ text: `Report ${name}`, onPress: actions.onReport });
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

function QrSegment() {
  const tabBarInset = useFloatingTabBarInset();
  return (
    <ScrollView
      contentContainerStyle={[styles.qrScroll, { paddingBottom: tabBarInset }]}
      showsVerticalScrollIndicator={false}
    >
      <MyQrCard />
    </ScrollView>
  );
}

function FriendsList() {
  const tabBarInset = useFloatingTabBarInset();
  const query = useFriendsQuery();
  const unfriend = useUnfriendMutation();
  const block = useBlockUserMutation();
  const reportSheet = useRef<ReportSheetRef>(null);
  const friends = query.data?.pages.flatMap((p) => p.items) ?? [];

  if (query.isLoading) return <Loading />;

  return (
    <>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.user.id}
        contentContainerStyle={[styles.list, { paddingBottom: tabBarInset }]}
        renderItem={({ item }) => (
          <UserRow
            user={item.user}
            right={
              <IconCircleButton
                icon="ellipsis-horizontal"
                accessibilityLabel={`Options for ${userDisplayName(item.user)}`}
                onPress={() =>
                  friendActionsAlert(item.user, {
                    onRemove: () => unfriend.mutate(item.user.id),
                    onBlock: () => block.mutate(item.user.id),
                    onReport: () =>
                      reportSheet.current?.present({
                        type: "USER",
                        id: item.user.id,
                      }),
                  })
                }
              />
            }
          />
        )}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            void query.fetchNextPage();
          }
        }}
        ListEmptyComponent={<Empty text="No friends yet. Share your QR!" />}
      />
      <ReportSheet ref={reportSheet} />
    </>
  );
}

type RequestRow =
  | { kind: "section"; key: string; label: string }
  | { kind: "request"; key: string; request: FriendRequest };

/** Incoming requests first (accept / decline), then the ones you sent. */
function RequestsList() {
  const tabBarInset = useFloatingTabBarInset();
  const incoming = useFriendRequestsQuery("incoming");
  const outgoing = useFriendRequestsQuery("outgoing");
  const accept = useAcceptFriendRequestMutation();
  const decline = useDeclineFriendRequestMutation();
  const cancel = useCancelFriendRequestMutation();

  const rows = useMemo<RequestRow[]>(() => {
    const received = incoming.data?.pages.flatMap((p) => p.items) ?? [];
    const sent = outgoing.data?.pages.flatMap((p) => p.items) ?? [];
    const out: RequestRow[] = received.map((request) => ({
      kind: "request",
      key: request.id,
      request,
    }));
    if (sent.length > 0) {
      out.push({ kind: "section", key: "sent", label: "Sent" });
      for (const request of sent) {
        out.push({ kind: "request", key: request.id, request });
      }
    }
    return out;
  }, [incoming.data, outgoing.data]);

  if (incoming.isLoading || outgoing.isLoading) return <Loading />;

  return (
    <FlatList
      data={rows}
      keyExtractor={(row) => row.key}
      contentContainerStyle={[styles.list, { paddingBottom: tabBarInset }]}
      renderItem={({ item }) => {
        if (item.kind === "section") {
          return <Text style={styles.section}>{item.label}</Text>;
        }
        const { request } = item;
        const name = userDisplayName(request.user);
        return (
          <UserRow
            user={request.user}
            right={
              request.direction === "incoming" ? (
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => accept.mutate(request.id)}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Accept ${name}`}
                  >
                    <GlossyOrb size={34}>
                      <Ionicons name="checkmark" size={18} color={AddyColors.ink} />
                    </GlossyOrb>
                  </Pressable>
                  <Pressable
                    onPress={() => decline.mutate(request.id)}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Decline ${name}`}
                    style={styles.declineOrb}
                  >
                    <Ionicons name="close" size={18} color={AddyColors.white} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => cancel.mutate(request.id)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Cancel request to ${name}`}
                  style={styles.cancelPill}
                >
                  <Text style={styles.cancelText}>cancel</Text>
                </Pressable>
              )
            }
          />
        );
      }}
      onEndReached={() => {
        if (incoming.hasNextPage && !incoming.isFetchingNextPage) {
          void incoming.fetchNextPage();
        } else if (outgoing.hasNextPage && !outgoing.isFetchingNextPage) {
          void outgoing.fetchNextPage();
        }
      }}
      ListEmptyComponent={<Empty text="No friend requests right now." />}
    />
  );
}

function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={AddyColors.ink} size="large" />
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
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    flex: 1,
    fontFamily: AddyFonts.title,
    fontSize: 24,
    lineHeight: 34,
    color: AddyColors.ink,
  },
  segments: { marginHorizontal: 16, marginBottom: 12 },
  qrScroll: { paddingHorizontal: 16, paddingTop: 12 },
  list: { paddingHorizontal: 16, paddingTop: 2, flexGrow: 1 },
  section: {
    fontFamily: AddyFonts.titleSemiBold,
    fontSize: 14,
    color: AddyColors.inkMuted,
    marginTop: 8,
    marginBottom: 8,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  emptyText: {
    fontFamily: AddyFonts.body,
    color: AddyColors.inkMuted,
    fontSize: 14,
    textAlign: "center",
  },
  rowActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  declineOrb: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AddyColors.pink,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: AddyRadius.pill,
    borderWidth: 1.5,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.paperDim,
  },
  cancelText: { fontFamily: AddyFonts.tech, fontSize: 17, color: AddyColors.ink },
});
