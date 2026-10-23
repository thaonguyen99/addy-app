import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlossyButton } from "@/components/ui/glossy-button";
import { IconCircleButton } from "@/components/ui/icon-circle-button";
import { TechChip } from "@/components/ui/tech-chip";
import { UserAvatar, userDisplayName } from "@/components/ui/user-row";
import { AddyColors, AddyFonts } from "@/constants/theme";
import {
  type AddTarget,
  celebrateFriend,
  useFriendSheetsStore,
} from "@/features/friends/store/friend-sheets-store";
import {
  ReportSheet,
  type ReportSheetRef,
} from "@/features/reports/components/report-sheet";
import { showToast } from "@/features/toast/toast-store";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  useAcceptFriendRequestMutation,
  useAcceptInviteMutation,
  useBlockUserMutation,
  useCancelFriendRequestMutation,
  useFriendRequestsQuery,
  useFriendsQuery,
  useInvitePreviewQuery,
  useSendFriendRequestMutation,
} from "@/lib/query/hooks";
import type { FriendRelationship, PublicUser } from "@/types/api";

/** One sheet for every way in: link, QR, search result, suggestion. */
export function AddFriendSheet() {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const reportSheet = useRef<ReportSheetRef>(null);
  const target = useFriendSheetsStore((s) => s.add);
  const closeAdd = useFriendSheetsStore((s) => s.closeAdd);
  // Keep rendering the last target while the sheet animates closed.
  const [shown, setShown] = useState<AddTarget | null>(null);

  useEffect(() => {
    if (!target) return;
    setShown(target);
    sheetRef.current?.present();
  }, [target]);

  const close = useCallback(() => sheetRef.current?.dismiss(), []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <>
      <BottomSheetModal
        ref={sheetRef}
        enablePanDownToClose
        topInset={insets.top}
        onDismiss={closeAdd}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.background}
      >
        <BottomSheetView
          style={[styles.content, { paddingBottom: insets.bottom + 12 }]}
        >
          {shown?.kind === "token" ? (
            <TokenBody
              token={shown.token}
              onClose={close}
              onReport={(user) =>
                reportSheet.current?.present({ type: "USER", id: user.id })
              }
            />
          ) : shown?.kind === "user" ? (
            <UserBody
              target={shown}
              onClose={close}
              onReport={(user) =>
                reportSheet.current?.present({ type: "USER", id: user.id })
              }
            />
          ) : null}
        </BottomSheetView>
      </BottomSheetModal>
      <ReportSheet ref={reportSheet} />
    </>
  );
}

type BodyProps = {
  onClose: () => void;
  onReport: (user: PublicUser) => void;
};

/** From a link or QR: "Add {name}" makes you friends right away. */
function TokenBody({ token, onClose, onReport }: BodyProps & { token: string }) {
  const preview = useInvitePreviewQuery(token);
  const acceptInvite = useAcceptInviteMutation();

  if (preview.isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={AddyColors.ink} />
      </View>
    );
  }

  if (preview.isError || !preview.data) {
    return (
      <View style={styles.message}>
        <Text style={styles.messageTitle}>
          This invite link is no longer valid.
        </Text>
        <GlossyButton label="Close" variant="secondary" onPress={onClose} style={styles.stretch} />
      </View>
    );
  }

  const { user, mutualCount, placesCount, relationship } = preview.data;
  const name = userDisplayName(user);

  if (relationship === "self") {
    return (
      <View style={styles.message}>
        <UserAvatar user={user} size={96} />
        <Text style={styles.messageTitle}>That&apos;s your own code</Text>
        <Text style={styles.caption}>Share it with a friend to add them.</Text>
        <GlossyButton label="Close" variant="secondary" onPress={onClose} style={styles.stretch} />
      </View>
    );
  }

  const add = () =>
    acceptInvite.mutate(token, {
      onSuccess: (result) => {
        onClose();
        celebrateFriend(result.friend.user);
      },
      onError: (error) =>
        showToast(getApiErrorMessage(error, "Couldn't add them. Try again.")),
    });

  return (
    <Profile
      user={user}
      invited
      mutualCount={mutualCount}
      placesCount={placesCount}
      onClose={onClose}
      onReport={onReport}
    >
      {relationship === "friend" ? (
        <GlossyButton label="Friends ✓" variant="secondary" disabled onPress={onClose} style={styles.stretch} />
      ) : (
        <GlossyButton
          label={`Add ${name}`}
          loading={acceptInvite.isPending}
          onPress={add}
          style={styles.stretch}
        />
      )}
    </Profile>
  );
}

/** From search or a suggestion: a friend request, with its states. */
function UserBody({
  target,
  onClose,
  onReport,
}: BodyProps & { target: Extract<AddTarget, { kind: "user" }> }) {
  const { user } = target;
  const name = userDisplayName(user);
  const { relationship, requestId, ready } = useLiveRelationship(
    user.id,
    target.relationship,
  );
  const send = useSendFriendRequestMutation();
  const accept = useAcceptFriendRequestMutation();
  const cancel = useCancelFriendRequestMutation();
  const busy = send.isPending || accept.isPending || cancel.isPending;
  const onError = (error: unknown) =>
    showToast(getApiErrorMessage(error, "Something went wrong. Try again."));

  let action: React.ReactNode;
  if (!ready) {
    action = <ActivityIndicator color={AddyColors.ink} style={styles.actionLoading} />;
  } else if (relationship === "friend") {
    action = (
      <GlossyButton label="Friends ✓" variant="secondary" disabled onPress={onClose} style={styles.stretch} />
    );
  } else if (relationship === "request_received") {
    action = (
      <GlossyButton
        label={`Accept ${name}`}
        loading={busy}
        disabled={!requestId}
        onPress={() =>
          requestId &&
          accept.mutate(requestId, {
            onSuccess: () => {
              onClose();
              celebrateFriend(user);
            },
            onError,
          })
        }
        style={styles.stretch}
      />
    );
  } else if (relationship === "request_sent") {
    action = (
      <View style={styles.sentBlock}>
        <GlossyButton label="Request sent ✓" variant="secondary" disabled onPress={onClose} style={styles.stretch} />
        <Pressable
          onPress={() => requestId && cancel.mutate(requestId, { onError })}
          disabled={!requestId || busy}
          accessibilityRole="button"
          hitSlop={6}
          style={styles.textButton}
        >
          <Text style={styles.cancelText}>Cancel request</Text>
        </Pressable>
      </View>
    );
  } else {
    action = (
      <GlossyButton
        label="Send request"
        loading={busy}
        onPress={() => send.mutate(user.id, { onError })}
        style={styles.stretch}
      />
    );
  }

  return (
    <Profile
      user={user}
      mutualCount={target.mutualCount}
      onClose={onClose}
      onReport={onReport}
    >
      {action}
    </Profile>
  );
}

/**
 * Where you stand with someone right now, from the request and friend lists
 * (search results and suggestions go stale as soon as you tap a button).
 */
function useLiveRelationship(
  userId: string,
  fallback: FriendRelationship | undefined,
): { relationship: FriendRelationship; requestId?: string; ready: boolean } {
  const incoming = useFriendRequestsQuery("incoming");
  const outgoing = useFriendRequestsQuery("outgoing");
  const friends = useFriendsQuery();

  return useMemo(() => {
    const ready = !incoming.isLoading && !outgoing.isLoading && !friends.isLoading;
    const received = incoming.data?.pages
      .flatMap((p) => p.items)
      .find((r) => r.user.id === userId);
    if (received) return { relationship: "request_received", requestId: received.id, ready };
    const sent = outgoing.data?.pages
      .flatMap((p) => p.items)
      .find((r) => r.user.id === userId);
    if (sent) return { relationship: "request_sent", requestId: sent.id, ready };
    const isFriend = friends.data?.pages
      .flatMap((p) => p.items)
      .some((f) => f.user.id === userId);
    // The friends list is paged, so trust an opener that already knew.
    if (isFriend || fallback === "friend") return { relationship: "friend", ready };
    return { relationship: "none", ready };
  }, [incoming.data, outgoing.data, friends.data, incoming.isLoading, outgoing.isLoading, friends.isLoading, userId, fallback]);
}

/** Avatar, name, handle, chips, the main action, Not now, and ⋯. */
function Profile({
  user,
  invited = false,
  mutualCount,
  placesCount,
  onClose,
  onReport,
  children,
}: BodyProps & {
  user: PublicUser;
  invited?: boolean;
  mutualCount?: number;
  placesCount?: number;
  children: React.ReactNode;
}) {
  const name = userDisplayName(user);
  const block = useBlockUserMutation();

  const openMore = () =>
    Alert.alert(name, undefined, [
      { text: "Cancel", style: "cancel" },
      { text: `Report ${name}`, onPress: () => onReport(user) },
      {
        text: `Block ${name}`,
        style: "destructive",
        onPress: () =>
          Alert.alert(
            `Block ${name}?`,
            "They won't be able to send you requests or see your memories. Any friendship is removed.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Block",
                style: "destructive",
                onPress: () =>
                  block.mutate(user.id, {
                    onSuccess: () => {
                      showToast(`Blocked ${name}`);
                      onClose();
                    },
                    onError: (error) =>
                      showToast(getApiErrorMessage(error, "Couldn't block them.")),
                  }),
              },
            ],
          ),
      },
    ]);

  return (
    <View style={styles.profile}>
      <View style={styles.more}>
        <IconCircleButton
          icon="ellipsis-horizontal"
          size={36}
          accessibilityLabel={`More options for ${name}`}
          onPress={openMore}
        />
      </View>

      {invited ? (
        <View style={styles.sticker}>
          <Text style={styles.stickerText}>✦ invited you</Text>
        </View>
      ) : null}
      <View style={styles.avatarRing}>
        <UserAvatar user={user} size={120} />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.handle}>@{user.username}</Text>

      {mutualCount || placesCount ? (
        <View style={styles.chips}>
          {mutualCount ? (
            <TechChip
              size="sm"
              label={`${mutualCount} mutual friend${mutualCount === 1 ? "" : "s"}`}
            />
          ) : null}
          {placesCount ? (
            <TechChip
              size="sm"
              label={`${placesCount} place${placesCount === 1 ? "" : "s"} pinned`}
            />
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        {children}
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          hitSlop={6}
          style={styles.textButton}
        >
          <Text style={styles.notNow}>Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: AddyColors.paper },
  handleIndicator: { backgroundColor: AddyColors.line, width: 40 },
  content: { paddingHorizontal: 16, paddingTop: 4 },
  stretch: { alignSelf: "stretch" },
  loading: { height: 260, alignItems: "center", justifyContent: "center" },
  message: { alignItems: "center", gap: 14, paddingVertical: 24 },
  messageTitle: {
    fontFamily: AddyFonts.title,
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
    color: AddyColors.ink,
  },
  caption: {
    fontFamily: AddyFonts.body,
    fontSize: 15,
    textAlign: "center",
    color: AddyColors.inkMuted,
  },
  profile: { alignItems: "center", gap: 6, paddingTop: 8 },
  more: { position: "absolute", top: 0, right: 0, zIndex: 1 },
  sticker: {
    zIndex: 1,
    marginBottom: -14,
    paddingHorizontal: 12,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: AddyColors.yellow,
    transform: [{ rotate: "-4deg" }],
  },
  stickerText: { fontFamily: AddyFonts.tech, fontSize: 20, color: AddyColors.ink },
  avatarRing: {
    padding: 4,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  name: {
    marginTop: 8,
    fontFamily: AddyFonts.title,
    fontSize: 28,
    lineHeight: 36,
    color: AddyColors.ink,
  },
  handle: { fontFamily: AddyFonts.tech, fontSize: 19, color: AddyColors.inkMuted },
  chips: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 8 },
  actions: { alignSelf: "stretch", alignItems: "center", gap: 4, marginTop: 18 },
  actionLoading: { height: 56 },
  sentBlock: { alignSelf: "stretch", alignItems: "center" },
  textButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12 },
  notNow: { fontFamily: AddyFonts.body, fontSize: 16, color: AddyColors.inkMuted },
  cancelText: { fontFamily: AddyFonts.bodyMedium, fontSize: 15, color: AddyColors.pink },
});
