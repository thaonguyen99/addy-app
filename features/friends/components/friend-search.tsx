import Ionicons from "@expo/vector-icons/Ionicons";
import { forwardRef, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { userDisplayName } from "@/components/ui/user-row";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";
import { PersonRow } from "@/features/friends/components/person-row";
import { PillButton } from "@/features/friends/components/pill-button";
import { SectionHeader } from "@/features/friends/components/section-header";
import { celebrateFriend } from "@/features/friends/store/friend-sheets-store";
import { shareInviteLink } from "@/features/invite/share-invite";
import { showToast } from "@/features/toast/toast-store";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  useAcceptFriendRequestMutation,
  useCancelFriendRequestMutation,
  useFriendRequestsQuery,
  useSendFriendRequestMutation,
  useUserSearchQuery,
} from "@/lib/query/hooks";
import type { UserSearchResult } from "@/types/api";

export const SEARCH_MIN_CHARS = 2;

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  focused: boolean;
  onFocus: () => void;
  onCancel: () => void;
};

/** "Find by username or name" pill; Cancel shows while it's in use. */
export const FriendSearchBar = forwardRef<TextInput, SearchBarProps>(
  function FriendSearchBar({ value, onChangeText, focused, onFocus, onCancel }, ref) {
    const active = focused || value.length > 0;
    return (
      <View style={[styles.bar, AddyShadow.soft, active && styles.barActive]}>
        <Ionicons name="search" size={20} color={AddyColors.inkMuted} />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder="Find by username or name"
          placeholderTextColor={AddyColors.inkMuted}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Find friends by username or name"
          style={styles.input}
        />
        {active ? (
          <Pressable
            onPress={onCancel}
            hitSlop={10}
            accessibilityRole="button"
            style={styles.cancel}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        ) : null}
      </View>
    );
  },
);

/** Results for `term`, replacing the tab content while searching. */
export function FriendSearchResults({
  term,
  link,
  onOpenUser,
}: {
  term: string;
  link: string;
  onOpenUser?: (result: UserSearchResult) => void;
}) {
  const query = useUserSearchQuery(term);
  const incoming = useFriendRequestsQuery("incoming");
  const outgoing = useFriendRequestsQuery("outgoing");
  const sendRequest = useSendFriendRequestMutation();
  const accept = useAcceptFriendRequestMutation();
  const cancel = useCancelFriendRequestMutation();
  const [pendingId, setPendingId] = useState<string | null>(null);

  // Accept/Cancel act on the request, so map each person to theirs.
  const requestIds = useMemo(() => {
    const byUser = new Map<string, string>();
    for (const page of incoming.data?.pages ?? []) {
      for (const r of page.items) byUser.set(r.user.id, r.id);
    }
    for (const page of outgoing.data?.pages ?? []) {
      for (const r of page.items) byUser.set(r.user.id, r.id);
    }
    return byUser;
  }, [incoming.data, outgoing.data]);

  const results = query.data?.pages.flatMap((p) => p.items) ?? [];
  const waiting = query.isFetching && results.length === 0;

  const run = (
    userId: string,
    mutate: (options: {
      onError: (error: unknown) => void;
      onSettled: () => void;
    }) => void,
  ) => {
    setPendingId(userId);
    mutate({
      onError: (error) =>
        showToast(getApiErrorMessage(error, "Something went wrong. Try again.")),
      onSettled: () => setPendingId(null),
    });
  };

  const action = (result: UserSearchResult) => {
    const name = userDisplayName(result);
    const loading = pendingId === result.id;
    const requestId = requestIds.get(result.id);
    switch (result.relationship) {
      case "none":
        return (
          <PillButton
            label="Add"
            loading={loading}
            accessibilityLabel={`Add ${name}`}
            onPress={() =>
              run(result.id, (o) => sendRequest.mutate(result.id, o))
            }
          />
        );
      case "request_received":
        return (
          <PillButton
            label="Accept"
            tone="cyan"
            loading={loading}
            disabled={!requestId}
            accessibilityLabel={`Accept ${name}`}
            onPress={() =>
              requestId &&
              run(result.id, (o) =>
                accept.mutate(requestId, {
                  ...o,
                  onSuccess: () => celebrateFriend(result),
                }),
              )
            }
          />
        );
      case "request_sent":
        return (
          <PillButton
            label="Cancel"
            tone="text"
            loading={loading}
            disabled={!requestId}
            accessibilityLabel={`Cancel request to ${name}`}
            onPress={() =>
              requestId && run(result.id, (o) => cancel.mutate(requestId, o))
            }
          />
        );
      case "friend":
        return <Text style={styles.friends}>Friends ✓</Text>;
    }
  };

  if (term.length < SEARCH_MIN_CHARS) {
    return <Text style={styles.hint}>Type at least 2 characters to search.</Text>;
  }

  if (waiting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={AddyColors.ink} />
      </View>
    );
  }

  return (
    <View style={styles.results}>
      {results.length > 0 ? (
        <>
          <SectionHeader title="Results" count={results.length} />
          <View>
            {results.map((result) => (
              <PersonRow
                key={result.id}
                user={result}
                subtitle={searchSubtitle(result)}
                highlighted={result.relationship === "request_received"}
                onPress={onOpenUser ? () => onOpenUser(result) : undefined}
                right={action(result)}
              />
            ))}
          </View>
        </>
      ) : null}

      <View style={[styles.notFound, AddyShadow.soft]}>
        <Text style={styles.notFoundText}>
          Can&apos;t find them? They may not be on Addy yet.
        </Text>
        <View style={styles.shareRow}>
          <Text style={styles.shareLabel}>Send your invite link</Text>
          <PillButton
            label="Share"
            disabled={!link}
            accessibilityLabel="Share your invite link"
            onPress={() => shareInviteLink(link)}
          />
        </View>
      </View>
    </View>
  );
}

function searchSubtitle(result: UserSearchResult): string {
  const parts = [`@${result.username}`];
  if (result.relationship === "request_received") parts.push("wants to be friends");
  else if (result.relationship === "request_sent") parts.push("request sent");
  else if (result.relationship === "none" && result.mutualCount) {
    parts.push(`${result.mutualCount} mutual`);
  }
  return parts.join(" · ");
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 16,
    borderRadius: AddyRadius.input + 4,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  barActive: { borderColor: AddyColors.cyan, borderWidth: 2 },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: AddyFonts.body,
    fontSize: 16,
    color: AddyColors.ink,
  },
  cancel: { minHeight: 44, justifyContent: "center" },
  cancelText: { fontFamily: AddyFonts.bodyMedium, fontSize: 16, color: "#2A9AD6" },
  results: { gap: 10 },
  center: { paddingVertical: 40, alignItems: "center" },
  hint: {
    paddingVertical: 32,
    textAlign: "center",
    fontFamily: AddyFonts.body,
    fontSize: 14,
    color: AddyColors.inkMuted,
  },
  friends: { fontFamily: AddyFonts.tech, fontSize: 19, color: AddyColors.inkMuted, paddingHorizontal: 8 },
  notFound: {
    gap: 12,
    padding: 16,
    marginTop: 4,
    borderRadius: 22,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  notFoundText: {
    fontFamily: AddyFonts.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    color: AddyColors.inkMuted,
  },
  shareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: AddyRadius.input,
    backgroundColor: AddyColors.paperDim,
  },
  shareLabel: { flex: 1, fontFamily: AddyFonts.tech, fontSize: 18, color: AddyColors.ink },
});
