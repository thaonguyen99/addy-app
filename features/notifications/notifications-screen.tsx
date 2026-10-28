import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SkyBackground } from "@/components/ui/sky-background";
import { AddyColors, AddyFonts } from "@/constants/theme";
import { ScreenHeader } from "@/features/friends/components/screen-header";
import { getApiErrorMessage } from "@/services/api/errors";
import {
  useAcceptFriendRequestMutation,
  useFriendRequestsQuery,
} from "@/services/friends";
import { useOnThisDayQuery } from "@/services/memories";
import {
  flattenNotificationPages,
  type NotificationDto,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useMarkNotificationsSeenMutation,
  useNotificationCountsQuery,
  useNotificationsQuery,
} from "@/services/notifications";
import { showToast } from "@/stores/toast.store";
import { openNotificationTarget, targetFromRow } from "./notification-target";
import { type AcceptState, NotificationRow } from "./notification-row";
import { NotificationsEmpty } from "./notifications-empty";
import { OnThisDayCard } from "./on-this-day-card";

type Section = { key: "new" | "earlier"; title: string; data: NotificationDto[] };

/**
 * The 🔔 list: On this day pinned on top, then unread ("New") and read
 * ("Earlier") rows, newest first. Opening it clears the badge; rows stay
 * tinted until tapped or "Read all".
 */
export function NotificationsScreen() {
  const list = useNotificationsQuery();
  const onThisDay = useOnThisDayQuery();
  const counts = useNotificationCountsQuery();
  const incoming = useFriendRequestsQuery("incoming");
  const markSeen = useMarkNotificationsSeenMutation();
  const markRead = useMarkNotificationReadMutation();
  const readAll = useMarkAllNotificationsReadMutation();
  const accept = useAcceptFriendRequestMutation();
  const [acceptStates, setAcceptStates] = useState<Record<string, AcceptState>>({});
  const [refreshing, setRefreshing] = useState(false);

  const { mutate: seen } = markSeen;
  useFocusEffect(
    useCallback(() => {
      seen();
    }, [seen]),
  );

  const rows = useMemo(() => flattenNotificationPages(list.data), [list.data]);
  const sections = useMemo<Section[]>(() => {
    const fresh = rows.filter((row) => row.readAt === null);
    const earlier = rows.filter((row) => row.readAt !== null);
    return [
      { key: "new" as const, title: "New", data: fresh },
      { key: "earlier" as const, title: "Earlier", data: earlier },
    ].filter((section) => section.data.length > 0);
  }, [rows]);

  const onPressRow = useCallback((row: NotificationDto) => {
    // openNotificationTarget marks the row read once it has navigated.
    void openNotificationTarget(targetFromRow(row));
  }, []);

  const { mutate: acceptRequest } = accept;
  const { mutate: read } = markRead;
  const incomingRequests = incoming.data;
  const onAccept = useCallback(
    (row: NotificationDto) => {
      const request = incomingRequests?.pages
        .flatMap((page) => page.items)
        .find((r) => r.user.id === row.target.id);
      if (!request) {
        showToast("That request isn't pending anymore");
        void incoming.refetch();
        return;
      }
      setAcceptStates((s) => ({ ...s, [row.id]: "pending" }));
      acceptRequest(request.id, {
        onSuccess: () => {
          setAcceptStates((s) => ({ ...s, [row.id]: "done" }));
          if (row.readAt === null) read(row.id);
        },
        onError: (error) => {
          setAcceptStates((s) => ({ ...s, [row.id]: "idle" }));
          showToast(getApiErrorMessage(error, "Couldn't accept that request."));
        },
      });
    },
    [incomingRequests, incoming, acceptRequest, read],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([
      list.refetch(),
      onThisDay.refetch(),
      counts.refetch(),
      incoming.refetch(),
    ]);
    setRefreshing(false);
  };

  const onEndReached = () => {
    if (list.hasNextPage && !list.isFetchingNextPage) void list.fetchNextPage();
  };

  const pinned = onThisDay.data?.[0];
  const hasUnread = (counts.data?.unread ?? 0) > 0 || rows.some((r) => r.readAt === null);

  return (
    <SkyBackground>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <ScreenHeader
          title="Notifications"
          fallback="/(app)/(tabs)/lane"
          right={
            hasUnread ? (
              <Pressable
                onPress={() => readAll.mutate()}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Mark all as read"
              >
                <Text style={styles.readAll}>Read all</Text>
              </Pressable>
            ) : null
          }
        />

        {list.isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={AddyColors.ink} />
          </View>
        ) : list.isError && rows.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.note}>Couldn&apos;t load your notifications.</Text>
            <Pressable onPress={() => void list.refetch()} hitSlop={8}>
              <Text style={styles.retry}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(row) => row.id}
            renderItem={({ item }) => (
              <NotificationRow
                row={item}
                onPress={onPressRow}
                onAccept={onAccept}
                acceptState={acceptStates[item.id]}
              />
            )}
            renderSectionHeader={({ section }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.key === "new" ? (
                  <Text style={styles.sectionCount}>{section.data.length}</Text>
                ) : null}
              </View>
            )}
            stickySectionHeadersEnabled={false}
            ListHeaderComponent={pinned ? <OnThisDayCard memory={pinned} /> : null}
            ListEmptyComponent={<NotificationsEmpty />}
            ListFooterComponent={
              list.isFetchingNextPage ? (
                <ActivityIndicator style={styles.footer} color={AddyColors.inkMuted} />
              ) : null
            }
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={AddyColors.inkMuted}
              />
            }
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  readAll: { fontFamily: AddyFonts.tech, fontSize: 18, color: "#2A8FC4" },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: 14,
    marginBottom: 6,
    marginHorizontal: 2,
  },
  sectionTitle: {
    fontFamily: AddyFonts.title,
    fontSize: 17,
    lineHeight: 24,
    color: AddyColors.ink,
  },
  sectionCount: { fontFamily: AddyFonts.tech, fontSize: 16, color: AddyColors.inkMuted },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  note: { fontFamily: AddyFonts.body, fontSize: 14, color: AddyColors.inkMuted },
  retry: { fontFamily: AddyFonts.title, fontSize: 15, color: "#3AA8E0" },
  footer: { paddingVertical: 20 },
});
