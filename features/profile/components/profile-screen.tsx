import { Redirect, router } from "expo-router";
import { useCallback, useMemo, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconCircleButton } from "@/components/ui/icon-circle-button";
import { SkyBackground } from "@/components/ui/sky-background";
import { userDisplayName } from "@/components/ui/user-row";
import { AddyColors, AddyFonts, AddyRadius } from "@/constants/theme";
import {
  type GridTileMemory,
  MemoryGridTile,
} from "@/features/feed/memory-grid-tile";
import { LockedGrid } from "@/features/profile/components/locked-grid";
import { MutualFriendsLine } from "@/features/profile/components/mutual-friends-line";
import { ProfileActions } from "@/features/profile/components/profile-actions";
import {
  ProfileBio,
  ProfileIdentity,
  ProfileIdentitySkeleton,
  ProfileSectionHeader,
  ProfileTopRow,
} from "@/features/profile/components/profile-header";
import { ProfileNotFound } from "@/features/profile/components/profile-not-found";
import { ProfileStatsCard } from "@/features/profile/components/profile-stats-card";
import {
  GRID_COLUMNS,
  GRID_GAP,
  PROFILE_SIDE_PADDING,
  useGridTileSize,
} from "@/features/profile/grid-layout";
import { isOwnUsername } from "@/features/profile/open-profile";
import { confirmBlock } from "@/features/social/confirm-block";
import {
  ReportSheet,
  type ReportSheetRef,
} from "@/features/reports/components/report-sheet";
import { safeBack } from "@/lib/safe-router";
import { getApiErrorMessage } from "@/services/api/errors";
import { useBlockUserMutation } from "@/services/social";
import {
  isUserNotFoundError,
  type PublicUser,
  type UserProfilePage,
  useUserMemoriesQuery,
  useUserProfileQuery,
} from "@/services/users";
import { useFriendSheetsStore } from "@/stores/friend-sheets.store";
import { showToast } from "@/stores/toast.store";

const goBack = () => safeBack("/(app)/(tabs)/friends");

/** Someone else's profile, opened by tapping their name or avatar anywhere. */
export function ProfileScreen({ username }: { username: string }) {
  const query = useUserProfileQuery(username);

  if (isOwnUsername(username) || query.data?.relationship === "self") {
    return <Redirect href="/(app)/(tabs)" />;
  }
  // A 404 wins even over cached data: they may have just blocked you.
  if (isUserNotFoundError(query.error) || !username) {
    return <ProfileNotFound onBack={goBack} />;
  }
  if (query.data) {
    return (
      <OtherProfile
        page={query.data}
        refreshing={query.isRefetching}
        onRefresh={() => void query.refetch()}
      />
    );
  }
  return (
    <SkyBackground>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.content}>
          <ProfileTopRow title={`@${username}`} left={<BackButton />} />
          <View style={styles.header}>
            <ProfileIdentitySkeleton />
            <ProfileStatsCard stats={null} />
            {query.isError ? (
              <View style={styles.error}>
                <Text style={styles.muted}>
                  {getApiErrorMessage(query.error, "Could not load this profile.")}
                </Text>
                <Pressable
                  style={styles.retry}
                  onPress={() => void query.refetch()}
                  accessibilityRole="button"
                >
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </SkyBackground>
  );
}

function BackButton() {
  return (
    <IconCircleButton
      icon="chevron-back"
      size={36}
      accessibilityLabel="Go back"
      onPress={goBack}
    />
  );
}

function OtherProfile({
  page,
  refreshing,
  onRefresh,
}: {
  page: UserProfilePage;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const relationship = page.relationship as Exclude<
    UserProfilePage["relationship"],
    "self"
  >;
  const person = useMemo<PublicUser>(
    () => ({
      id: page.user.id,
      username: page.user.username,
      name: page.user.displayName,
      avatarUrl: page.user.avatarUrl,
    }),
    [page.user],
  );
  const name = userDisplayName(person);
  const isFriend = relationship === "friend";
  const isBlocked = relationship === "blocked_by_me";
  const reportSheet = useRef<ReportSheetRef>(null);
  const block = useBlockUserMutation();
  const tileSize = useGridTileSize();

  const memories = useUserMemoriesQuery(person.username, isFriend);
  const tiles = useMemo<GridTileMemory[]>(
    () =>
      isFriend
        ? (memories.data?.pages.flatMap((p) => p.items) ?? []).map((m) => ({
            id: m.id,
            imageUrl: m.thumbnailUrl,
            moodScore: m.moodScore,
            placeName: m.placeName,
          }))
        : [],
    [isFriend, memories.data],
  );

  const openFriendMenu = useCallback(
    () =>
      useFriendSheetsStore
        .getState()
        .openFriendMenu({ user: person, friendsSince: page.friendsSince }),
    [person, page.friendsSince],
  );

  const report = () =>
    reportSheet.current?.present({ type: "USER", id: person.id });

  const openMore = () => {
    if (isFriend) {
      openFriendMenu();
      return;
    }
    Alert.alert(name, undefined, [
      { text: "Cancel", style: "cancel" },
      { text: `Report ${name}`, onPress: report },
      ...(isBlocked
        ? []
        : [
            {
              text: `Block ${name}`,
              style: "destructive" as const,
              onPress: () =>
                confirmBlock(name, () =>
                  block.mutate(person.id, {
                    onSuccess: () => showToast(`Blocked ${name}`),
                    onError: (error) =>
                      showToast(
                        getApiErrorMessage(error, "Couldn't block them."),
                      ),
                  }),
                ),
            },
          ]),
    ]);
  };

  const openMap = () =>
    router.navigate({
      pathname: "/(app)/(tabs)/explore",
      params: { friend: person.id },
    });

  const openMemory = useCallback((id: string) => {
    router.push(`/memory/${id}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: GridTileMemory }) => (
      <MemoryGridTile memory={item} size={tileSize} onPress={openMemory} />
    ),
    [openMemory, tileSize],
  );

  const header = (
    <View style={styles.header}>
      <ProfileTopRow
        title={`@${person.username}`}
        left={<BackButton />}
        right={
          <IconCircleButton
            icon="ellipsis-horizontal"
            size={36}
            accessibilityLabel={`More options for ${name}`}
            onPress={openMore}
          />
        }
      />
      <ProfileIdentity
        user={person}
        name={name}
        below={page.user.bio ? <ProfileBio text={page.user.bio} /> : null}
      />
      <ProfileStatsCard stats={isBlocked ? null : page.stats} />
      <ProfileActions
        user={person}
        name={name}
        relationship={relationship}
        onOpenFriendMenu={openFriendMenu}
      />
      {isBlocked ? null : <MutualFriendsLine mutual={page.mutualFriends} />}
      {isFriend ? (
        <ProfileSectionHeader title="Shared with you" onPressMap={openMap} />
      ) : null}
    </View>
  );

  const footer = isFriend ? (
    memories.isLoading || memories.isFetchingNextPage ? (
      <ActivityIndicator color={AddyColors.inkMuted} style={styles.footer} />
    ) : memories.isError ? (
      <Pressable onPress={() => void memories.refetch()} style={styles.footer}>
        <Text style={styles.muted}>couldn&apos;t load memories · tap to retry</Text>
      </Pressable>
    ) : tiles.length === 0 ? (
      <Text style={[styles.muted, styles.footer]}>
        Nothing shared with you yet.
      </Text>
    ) : null
  ) : isBlocked ? null : (
    <LockedGrid name={name} />
  );

  return (
    <SkyBackground>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <FlatList
          data={tiles}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={GRID_COLUMNS}
          columnWrapperStyle={styles.column}
          ItemSeparatorComponent={GridSeparator}
          ListHeaderComponent={header}
          ListFooterComponent={footer}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (memories.hasNextPage && !memories.isFetchingNextPage) {
              void memories.fetchNextPage();
            }
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={AddyColors.inkMuted}
            />
          }
        />
        <ReportSheet ref={reportSheet} />
      </SafeAreaView>
    </SkyBackground>
  );
}

function GridSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: PROFILE_SIDE_PADDING },
  list: { paddingHorizontal: PROFILE_SIDE_PADDING, paddingBottom: 40 },
  header: { gap: 16, marginBottom: 12 },
  column: { gap: GRID_GAP },
  separator: { height: GRID_GAP },
  footer: { paddingVertical: 20, textAlign: "center", alignItems: "center" },
  error: { alignItems: "center", gap: 12, paddingTop: 16 },
  muted: {
    fontFamily: AddyFonts.body,
    fontSize: 14,
    color: AddyColors.inkMuted,
    textAlign: "center",
  },
  retry: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: AddyRadius.pill,
    backgroundColor: AddyColors.white,
  },
  retryText: { fontFamily: AddyFonts.title, color: AddyColors.ink },
});
