import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SkyBackground } from "@/components/ui/sky-background";
import { UserRow } from "@/components/ui/user-row";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
} from "@/constants/theme";
import { AuthTextField } from "@/features/auth/components/auth-text-field";
import { ScreenHeader } from "@/features/friends/components/screen-header";
import {
  useSendFriendRequestMutation,
  useUserSearchQuery,
} from "@/lib/query/hooks";
import type { FriendRelationship, UserSearchResult } from "@/types/api";

const RELATIONSHIP_LABEL: Record<FriendRelationship, string> = {
  none: "Add",
  friend: "Friends",
  request_sent: "Requested",
  request_received: "Respond",
};

/**
 * Find someone by username. Your own QR and incoming requests live on the
 * Friends tab's segments, not here.
 */
export function AddFriendsScreen() {
  return (
    <SkyBackground>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ScreenHeader title="Find friends" fallback="/(app)/(tabs)/friends" />
        <SearchTab />
      </SafeAreaView>
    </SkyBackground>
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
          <ActivityIndicator color={AddyColors.ink} />
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

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  searchBox: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 40, flexGrow: 1 },
  empty: {
    fontFamily: AddyFonts.body,
    color: AddyColors.inkMuted,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 40,
  },
  action: {
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: AddyRadius.pill,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.paperDim,
  },
  actionPrimary: {
    backgroundColor: AddyColors.lime,
    borderColor: AddyColors.limeDeep,
  },
  actionText: { fontFamily: AddyFonts.title, fontSize: 13, color: AddyColors.inkMuted },
  actionTextPrimary: { color: AddyColors.ink },
});
