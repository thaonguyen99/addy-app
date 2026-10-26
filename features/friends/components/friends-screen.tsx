import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useFloatingTabBarInset } from "@/components/navigation/floating-tab-bar";
import { SkyBackground } from "@/components/ui/sky-background";
import { TechChip } from "@/components/ui/tech-chip";
import { userDisplayName } from "@/components/ui/user-row";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";
import { formatRelativeTime } from "@/utils/format-relative-time";
import {
  FriendSearchBar,
  FriendSearchResults,
  SEARCH_MIN_CHARS,
} from "@/features/friends/components/friend-search";
import { InviteCard } from "@/features/friends/components/invite-card";
import { InviteStrip } from "@/features/friends/components/invite-strip";
import { PersonRow } from "@/features/friends/components/person-row";
import { PillButton } from "@/features/friends/components/pill-button";
import { SectionHeader } from "@/features/friends/components/section-header";
import { SkeletonRow } from "@/features/friends/components/skeleton-row";
import { SuggestionsRow } from "@/features/friends/components/suggestions-row";
import { getApiErrorMessage } from "@/services/api/errors";
import type { Friend, FriendRequest } from "@/services/friends";
import {
  useAcceptFriendRequestMutation,
  useDeclineFriendRequestMutation,
  useFriendRequestsQuery,
  useFriendSuggestionsQuery,
  useFriendsQuery,
} from "@/services/friends";
import { useInviteQuery } from "@/services/social";
import type { PublicUser } from "@/services/users";
import { useProfileQuery } from "@/services/users";
import {
  celebrateFriend,
  useFriendSheetsStore,
} from "@/stores/friend-sheets.store";
import { showToast } from "@/stores/toast.store";

const SIDE_PADDING = 16;
const SEARCH_DEBOUNCE_MS = 400;

/**
 * The Friends tab: search in place, incoming requests, invite, suggestions,
 * and your friends. `?tab=invite` scrolls to the invite; `?tab=incoming` to
 * the top, where requests sit.
 */
export function FriendsScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const tabBarInset = useFloatingTabBarInset();
  const listRef = useRef<FlatList<Friend>>(null);
  const searchRef = useRef<TextInput>(null);

  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const [focused, setFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteY, setInviteY] = useState<number | null>(null);

  const friendsQuery = useFriendsQuery();
  const incomingQuery = useFriendRequestsQuery("incoming");
  const suggestionsQuery = useFriendSuggestionsQuery();
  const inviteQuery = useInviteQuery();
  const { data: profile } = useProfileQuery();
  const accept = useAcceptFriendRequestMutation();
  const decline = useDeclineFriendRequestMutation();
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  const friends = friendsQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const incoming = incomingQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const link = inviteQuery.data?.webUrl ?? "";
  const searching =
    term.length >= SEARCH_MIN_CHARS && input.trim().length >= SEARCH_MIN_CHARS;
  const loading = friendsQuery.isLoading || incomingQuery.isLoading;

  // Debounce the search term so each keystroke doesn't hit the server.
  useEffect(() => {
    const next = input.trim();
    const timer = setTimeout(() => setTerm(next), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  // Deep links (?tab=invite from the You tab's 💌, ?tab=incoming from a push).
  useEffect(() => {
    if (params.tab === "invite" && inviteY !== null) {
      listRef.current?.scrollToOffset({
        offset: Math.max(0, inviteY - 12),
        animated: true,
      });
    } else if (params.tab === "incoming" || params.tab === "requests") {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    } else {
      return;
    }
    // Clear it so the next 💌 tap scrolls again.
    router.setParams({ tab: undefined });
  }, [params.tab, inviteY]);

  const cancelSearch = () => {
    setInput("");
    setTerm("");
    setFocused(false);
    searchRef.current?.blur();
    Keyboard.dismiss();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([
      friendsQuery.refetch(),
      incomingQuery.refetch(),
      suggestionsQuery.refetch(),
      inviteQuery.refetch(),
    ]);
    setRefreshing(false);
  }, [friendsQuery, incomingQuery, suggestionsQuery, inviteQuery]);

  const openQr = () => useFriendSheetsStore.getState().openQr("code");
  const openAdd = useFriendSheetsStore.getState().openAdd;

  const openFriendMap = (user: PublicUser) =>
    router.navigate({
      pathname: "/(app)/(tabs)/explore",
      params: { friend: user.id },
    });

  const openFriendMenu = (friend: Friend) =>
    useFriendSheetsStore.getState().openFriendMenu({
      user: friend.user,
      friendsSince: friend.friendsSince,
    });

  const respond = (request: FriendRequest, action: "accept" | "decline") => {
    setPendingRequestId(request.id);
    (action === "accept" ? accept : decline).mutate(request.id, {
      onSuccess: () => {
        if (action === "accept") celebrateFriend(request.user);
      },
      onError: (error) =>
        showToast(
          getApiErrorMessage(error, "Something went wrong. Try again."),
        ),
      onSettled: () => setPendingRequestId(null),
    });
  };

  const header = searching ? (
    <FriendSearchResults
      term={term}
      link={link}
      onOpenUser={(result) =>
        openAdd({
          kind: "user",
          user: result,
          relationship: result.relationship,
          ...(result.mutualCount !== undefined
            ? { mutualCount: result.mutualCount }
            : {}),
        })
      }
    />
  ) : loading ? (
    <View>
      {[0, 1, 2, 3].map((i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  ) : (
    <View style={styles.sections}>
      {incoming.length > 0 ? (
        <View>
          <SectionHeader title="Wants to be friends" count={incoming.length} />
          <View style={styles.sectionBody}>
            {incoming.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                pending={pendingRequestId === request.id}
                onAccept={() => respond(request, "accept")}
                onDecline={() => respond(request, "decline")}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View onLayout={(e) => setInviteY(e.nativeEvent.layout.y)}>
        {/* The big card is for an empty friends list; once you have friends,
            the slim strip keeps them in view. */}
        {friendsQuery.isLoading ? null : friends.length === 0 ? (
          <InviteCard me={profile} link={link} onShowQr={openQr} />
        ) : (
          <InviteStrip link={link} />
        )}
      </View>

      <SuggestionsRow
        onOpenUser={({ user, mutualCount }) =>
          openAdd({ kind: "user", user, relationship: "none", mutualCount })
        }
      />

      {friends.length > 0 ? (
        <SectionHeader title="Your friends" count={friends.length} />
      ) : null}
    </View>
  );

  return (
    <SkyBackground>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          <Text style={styles.title}>Friends</Text>
          <Pressable
            onPress={openQr}
            accessibilityRole="button"
            accessibilityLabel="My QR code and scan"
            style={({ pressed }) => [
              styles.qrPill,
              AddyShadow.soft,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="qr-code" size={18} color={AddyColors.ink} />
            <Text style={styles.qrPillText}>My QR · Scan</Text>
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <FriendSearchBar
            ref={searchRef}
            value={input}
            onChangeText={setInput}
            focused={focused}
            onFocus={() => setFocused(true)}
            onCancel={cancelSearch}
          />
        </View>

        <FlatList
          ref={listRef}
          data={searching || loading ? [] : friends}
          keyExtractor={(item) => item.user.id}
          ListHeaderComponent={header}
          ListHeaderComponentStyle={styles.listHeader}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: tabBarInset + 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          refreshControl={
            searching ? undefined : (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void onRefresh()}
                tintColor={AddyColors.ink}
              />
            )
          }
          renderItem={({ item }) => (
            <PersonRow
              user={item.user}
              subtitle={friendSubtitle(item)}
              onPress={() => openFriendMap(item.user)}
              onLongPress={() => openFriendMenu(item)}
              accessibilityHint="Opens their map. Long press for more options."
              right={
                <TechChip
                  label="map"
                  trailing="›"
                  size="sm"
                  accessibilityLabel={`See ${userDisplayName(item.user)}'s map`}
                  onPress={() => openFriendMap(item.user)}
                />
              }
            />
          )}
          onEndReached={() => {
            if (
              !searching &&
              friendsQuery.hasNextPage &&
              !friendsQuery.isFetchingNextPage
            ) {
              void friendsQuery.fetchNextPage();
            }
          }}
        />
      </SafeAreaView>
    </SkyBackground>
  );
}

function friendSubtitle(friend: Friend): string {
  const last = friend.lastSharedMemory;
  // Older servers don't send it at all: fall back to the handle.
  if (last === undefined) return `@${friend.user.username}`;
  if (last === null) return "no shared memories yet";
  return `📍 pinned ${last.placeName} · ${formatRelativeTime(last.capturedAt)}`;
}

function RequestRow({
  request,
  pending,
  onAccept,
  onDecline,
}: {
  request: FriendRequest;
  pending: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const name = userDisplayName(request.user);
  const mutual = request.mutualCount ?? 0;
  return (
    <PersonRow
      user={request.user}
      highlighted
      subtitle={
        mutual > 0
          ? `${mutual} mutual friend${mutual === 1 ? "" : "s"}`
          : `@${request.user.username}`
      }
      right={
        <>
          <PillButton
            label="Accept"
            tone="cyan"
            loading={pending}
            accessibilityLabel={`Accept ${name}`}
            onPress={onAccept}
          />
          <Pressable
            onPress={onDecline}
            disabled={pending}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={`Decline ${name}`}
            style={({ pressed }) => [styles.decline, pressed && styles.pressed]}
          >
            <Ionicons name="close" size={20} color={AddyColors.ink} />
          </Pressable>
        </>
      }
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: {
    flex: 1,
    fontFamily: AddyFonts.title,
    fontSize: 32,
    lineHeight: 42,
    color: AddyColors.ink,
  },
  qrPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: AddyRadius.pill,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  qrPillText: {
    fontFamily: AddyFonts.title,
    fontSize: 16,
    color: AddyColors.ink,
  },
  searchWrap: { paddingHorizontal: SIDE_PADDING, paddingBottom: 12 },
  list: { paddingHorizontal: SIDE_PADDING, paddingTop: 4, flexGrow: 1 },
  listHeader: { marginBottom: 10 },
  sections: { gap: 20 },
  sectionBody: { marginTop: 10 },
  decline: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  pressed: { opacity: 0.75 },
});
