import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
// RNGH's ScrollView, so scrolling the row wins over the tab swipe.
import { ScrollView } from "react-native-gesture-handler";
import { create } from "zustand";

import { UserAvatar, userDisplayName } from "@/components/ui/user-row";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyShadow,
} from "@/constants/theme";
import { PillButton } from "@/features/friends/components/pill-button";
import { SectionHeader } from "@/features/friends/components/section-header";
import { showToast } from "@/stores/toast.store";
import { getApiErrorMessage } from "@/services/api/errors";
import { useFriendSuggestionsQuery, useSendFriendRequestMutation } from "@/services/friends";
import type { FriendSuggestion } from "@/services/friends";

/**
 * Hiding lasts for this app session only (in memory, not persisted), so the
 * row comes back the next time the app starts.
 */
const useSuggestionsHidden = create<{ hidden: boolean; hide: () => void }>(
  (set) => ({ hidden: false, hide: () => set({ hidden: true }) }),
);

/** "People you may know": hidden when the server has none (or no endpoint). */
export function SuggestionsRow({
  onOpenUser,
}: {
  onOpenUser?: (suggestion: FriendSuggestion) => void;
}) {
  const hidden = useSuggestionsHidden((s) => s.hidden);
  const hide = useSuggestionsHidden((s) => s.hide);
  const query = useFriendSuggestionsQuery(!hidden);
  const sendRequest = useSendFriendRequestMutation();
  // A sent request drops the person from the refetched list; keep their
  // card around as "Sent" until the tab remounts.
  const [sent, setSent] = useState<FriendSuggestion[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const live = query.data ?? [];
  const liveIds = new Set(live.map((s) => s.user.id));
  const items = [...live, ...sent.filter((s) => !liveIds.has(s.user.id))];
  const sentIds = new Set(sent.map((s) => s.user.id));

  if (hidden || query.isError || items.length === 0) return null;

  const add = (suggestion: FriendSuggestion) => {
    setPendingId(suggestion.user.id);
    sendRequest.mutate(suggestion.user.id, {
      onSuccess: () => setSent((prev) => [...prev, suggestion]),
      onError: (error) =>
        showToast(getApiErrorMessage(error, "Couldn't send the request.")),
      onSettled: () => setPendingId(null),
    });
  };

  return (
    <View style={styles.section}>
      <SectionHeader
        title="People you may know"
        // note="friends of friends"
        onClose={hide}
        closeLabel="Hide people you may know"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        style={styles.scroller}
      >
        {items.map((suggestion) => {
          const { user, mutualCount } = suggestion;
          const isSent = sentIds.has(user.id);
          return (
            <Pressable
              key={user.id}
              onPress={onOpenUser ? () => onOpenUser(suggestion) : undefined}
              disabled={!onOpenUser}
              accessibilityLabel={`${userDisplayName(user)}, ${mutualCount} mutual`}
              style={[styles.card, AddyShadow.soft]}
            >
              <UserAvatar user={user} size={64} />
              <Text style={styles.name} numberOfLines={1}>
                {userDisplayName(user)}
              </Text>
              <Text style={styles.mutual}>{mutualCount} mutual</Text>
              <PillButton
                label={isSent ? "Sent" : "Add"}
                tone={isSent ? "paper" : "lime"}
                disabled={isSent}
                loading={pendingId === user.id}
                accessibilityLabel={
                  isSent
                    ? `Request sent to ${userDisplayName(user)}`
                    : `Add ${userDisplayName(user)}`
                }
                onPress={() => add(suggestion)}
                style={styles.button}
              />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  scroller: { marginHorizontal: -16 },
  row: { gap: 12, paddingHorizontal: 16, paddingBottom: 6 },
  card: {
    width: 150,
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  name: {
    marginTop: 4,
    fontFamily: AddyFonts.title,
    fontSize: 16,
    lineHeight: 22,
    color: AddyColors.ink,
  },
  mutual: {
    fontFamily: AddyFonts.tech,
    fontSize: 16,
    color: AddyColors.inkMuted,
  },
  button: { alignSelf: "stretch", marginTop: 6 },
});
