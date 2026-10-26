import { router } from "expo-router";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";

import { GlossyButton } from "@/components/ui/glossy-button";
import { AddyColors } from "@/constants/theme";
import { useLiveRelationship } from "@/features/friends/use-live-relationship";
import { confirmUnblock } from "@/features/social/confirm-block";
import { getApiErrorMessage } from "@/services/api/errors";
import {
  useAcceptFriendRequestMutation,
  useCancelFriendRequestMutation,
  useSendFriendRequestMutation,
} from "@/services/friends";
import { useUnblockUserMutation } from "@/services/social";
import type { ProfileRelationship, PublicUser } from "@/services/users";
import { celebrateFriend } from "@/stores/friend-sheets.store";
import { showToast } from "@/stores/toast.store";

const onError = (error: unknown) =>
  showToast(getApiErrorMessage(error, "Something went wrong. Try again."));

/** The button row under someone's stats, by where you stand with them. */
export function ProfileActions({
  user,
  name,
  relationship,
  onOpenFriendMenu,
}: {
  user: PublicUser;
  name: string;
  relationship: Exclude<ProfileRelationship, "self">;
  onOpenFriendMenu: () => void;
}) {
  if (relationship === "friend") {
    return (
      <View style={styles.row}>
        <GlossyButton
          label={`🗺️ See ${name}'s map`}
          onPress={() =>
            router.navigate({
              pathname: "/(app)/(tabs)/explore",
              params: { friend: user.id },
            })
          }
          style={styles.mapButton}
        />
        <GlossyButton
          label="Friends ✓"
          variant="ghost"
          onPress={onOpenFriendMenu}
          style={styles.flex}
        />
      </View>
    );
  }
  if (relationship === "blocked_by_me") {
    return <UnblockButton user={user} name={name} />;
  }
  return <RequestButton user={user} name={name} relationship={relationship} />;
}

function UnblockButton({ user, name }: { user: PublicUser; name: string }) {
  const unblock = useUnblockUserMutation();
  return (
    <GlossyButton
      label="Unblock"
      variant="ghost"
      loading={unblock.isPending}
      onPress={() =>
        confirmUnblock(name, () =>
          unblock.mutate(user.id, {
            onSuccess: () => showToast(`Unblocked ${name}`),
            onError,
          }),
        )
      }
    />
  );
}

/** Add friend → Requested (tap to cancel) · Accept, for people you aren't friends with. */
function RequestButton({
  user,
  name,
  relationship,
}: {
  user: PublicUser;
  name: string;
  relationship: "none" | "request_sent" | "request_received";
}) {
  // The profile says where you stand; the request lists know the request id.
  const live = useLiveRelationship(user.id, undefined);
  const send = useSendFriendRequestMutation();
  const accept = useAcceptFriendRequestMutation();
  const cancel = useCancelFriendRequestMutation();
  const busy = send.isPending || accept.isPending || cancel.isPending;
  const requestId =
    live.relationship === relationship ? live.requestId : undefined;

  if (relationship === "none") {
    return (
      <GlossyButton
        label="＋ Add friend"
        loading={busy}
        onPress={() => send.mutate(user.id, { onError })}
      />
    );
  }

  if (!live.ready) {
    return <ActivityIndicator color={AddyColors.ink} style={styles.loading} />;
  }

  if (relationship === "request_received") {
    return (
      <GlossyButton
        label="Accept"
        variant="cyan"
        loading={busy}
        disabled={!requestId}
        onPress={() =>
          requestId &&
          accept.mutate(requestId, {
            onSuccess: () => celebrateFriend(user),
            onError,
          })
        }
      />
    );
  }

  return (
    <GlossyButton
      label="Requested"
      variant="ghost"
      loading={busy}
      disabled={!requestId}
      onPress={() =>
        requestId &&
        Alert.alert(`Cancel your request to ${name}?`, undefined, [
          { text: "Keep", style: "cancel" },
          {
            text: "Cancel request",
            style: "destructive",
            onPress: () => cancel.mutate(requestId, { onError }),
          },
        ])
      }
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  mapButton: { flex: 1.35, paddingHorizontal: 14 },
  flex: { flex: 1, paddingHorizontal: 14 },
  loading: { height: 50 },
});
