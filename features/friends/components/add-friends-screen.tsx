import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";

import { GlossyButton } from "@/components/ui/glossy-button";
import { StickerCard } from "@/components/ui/sticker-card";
import { UserRow } from "@/components/ui/user-row";
import { BrandColors } from "@/constants/theme";
import { StickerRadius } from "@/constants/sticker-style";
import { AuthTextField } from "@/features/auth/components/auth-text-field";
import { ScreenHeader } from "@/features/friends/components/screen-header";
import {
  useInviteQuery,
  useProfileQuery,
  useSendFriendRequestMutation,
  useUserSearchQuery,
} from "@/lib/query/hooks";
import type { FriendRelationship, UserSearchResult } from "@/types/api";

type Tab = "search" | "qr";

const RELATIONSHIP_LABEL: Record<FriendRelationship, string> = {
  none: "Add",
  friend: "Friends",
  request_sent: "Requested",
  request_received: "Respond",
};

/**
 * Two ways to add someone: search by username, or trade QR codes. Incoming
 * requests live on the Friends hub's own "Requests" tab, not here — this
 * screen used to duplicate that list.
 */
export function AddFriendsScreen() {
  const [tab, setTab] = useState<Tab>("search");

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Add friends"
        fallback="/(app)/friends"
        right={
          <Pressable
            onPress={() => router.push("/(app)/friends/scan")}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Scan a friend's QR code"
          >
            <Ionicons name="scan-outline" size={22} color={BrandColors.primary} />
          </Pressable>
        }
      />

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === "search" && styles.tabActive]}
          onPress={() => setTab("search")}
        >
          <Text
            style={[styles.tabLabel, tab === "search" && styles.tabLabelActive]}
          >
            Search
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "qr" && styles.tabActive]}
          onPress={() => setTab("qr")}
        >
          <Text style={[styles.tabLabel, tab === "qr" && styles.tabLabelActive]}>
            My QR
          </Text>
        </Pressable>
      </View>

      {tab === "search" ? <SearchTab /> : <QrTab />}
    </SafeAreaView>
  );
}

function SearchTab() {
  const [input, setInput] = useState("");
  const [term, setTerm] = useState("");
  const latest = useRef("");
  latest.current = input.trim();

  // Debounce the query term, mirroring the username check in account-screen.
  useEffect(() => {
    const next = input.trim();
    const timer = setTimeout(() => {
      if (latest.current === next) setTerm(next);
    }, 400);
    return () => clearTimeout(timer);
  }, [input]);

  const query = useUserSearchQuery(term);
  const sendRequest = useSendFriendRequestMutation();
  const results = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <View style={styles.searchBox}>
        <AuthTextField
          label="Search"
          placeholder="Username or name"
          autoCapitalize="none"
          autoCorrect={false}
          value={input}
          onChangeText={setInput}
        />
      </View>

      {query.isFetching && results.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={BrandColors.primary} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <SearchResultRow
              result={item}
              pending={sendRequest.isPending}
              onAdd={() => sendRequest.mutate(item.id)}
            />
          )}
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          ListEmptyComponent={
            term.length >= 2 ? (
              <Text style={styles.empty}>No users found for “{term}”.</Text>
            ) : (
              <Text style={styles.empty}>
                Type at least 2 characters to search.
              </Text>
            )
          }
        />
      )}
    </>
  );
}

function SearchResultRow({
  result,
  pending,
  onAdd,
}: {
  result: UserSearchResult;
  pending: boolean;
  onAdd: () => void;
}) {
  const actionable = result.relationship === "none";
  return (
    <UserRow
      user={result}
      right={
        <Pressable
          disabled={!actionable || pending}
          onPress={onAdd}
          style={[styles.action, actionable && styles.actionPrimary]}
        >
          <Text
            style={[styles.actionText, actionable && styles.actionTextPrimary]}
          >
            {RELATIONSHIP_LABEL[result.relationship]}
          </Text>
        </Pressable>
      }
    />
  );
}

function QrTab() {
  const { data: profile } = useProfileQuery();
  const inviteQuery = useInviteQuery();

  const onShare = useCallback(() => {
    if (!inviteQuery.data) return;
    void Share.share({ message: `Add me on Addy: ${inviteQuery.data.url}` });
  }, [inviteQuery.data]);

  return (
    <View style={styles.qrBody}>
      {inviteQuery.isLoading || !inviteQuery.data ? (
        <ActivityIndicator color={BrandColors.primary} />
      ) : (
        <>
          <View style={styles.qrCardWrap}>
            <Text style={styles.qrStar}>✦</Text>
            <StickerCard radius={StickerRadius.card} style={styles.qrCardShadow}>
              <View style={styles.qrCard}>
                <QRCode
                  value={inviteQuery.data.url}
                  size={180}
                  backgroundColor={BrandColors.paper}
                  color={BrandColors.ink}
                />
                {profile ? (
                  <Text style={styles.qrUsername}>@{profile.username}</Text>
                ) : null}
              </View>
            </StickerCard>
          </View>
          <GlossyButton label="🔗 Share my QR" onPress={onShare} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.paper },
  tabs: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 16,
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
  tabLabel: {
    fontFamily: "Fredoka-SemiBold",
    fontSize: 15,
    color: BrandColors.ink,
  },
  tabLabelActive: { color: BrandColors.ink },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  searchBox: { paddingHorizontal: 16, paddingBottom: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 40, flexGrow: 1 },
  empty: {
    color: BrandColors.neutralMuted,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 40,
  },
  action: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: BrandColors.elevated,
  },
  actionPrimary: {
    backgroundColor: BrandColors.primary,
    borderWidth: 2,
    borderColor: BrandColors.ink,
  },
  actionText: { fontSize: 13, fontWeight: "600", color: BrandColors.inkMuted },
  actionTextPrimary: { color: BrandColors.ink },
  qrBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    padding: 32,
  },
  qrCardWrap: { position: "relative" },
  qrStar: {
    position: "absolute",
    top: -16,
    right: -8,
    fontSize: 26,
    color: BrandColors.accentYellow,
    zIndex: 1,
    transform: [{ rotate: "15deg" }],
  },
  qrCardShadow: { alignSelf: "center" },
  qrCard: { padding: 20, alignItems: "center", gap: 10 },
  qrUsername: {
    fontFamily: "Fredoka-SemiBold",
    fontSize: 15,
    color: BrandColors.ink,
  },
});
