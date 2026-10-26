import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useRef, useState } from "react";
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
} from "@/stores/friend-sheets.store";
import {
  ReportSheet,
  type ReportSheetRef,
} from "@/features/reports/components/report-sheet";
import { showToast } from "@/stores/toast.store";
import { getApiErrorMessage } from "@/services/api/errors";
import { confirmBlock } from "@/features/social/confirm-block";
import { useAcceptInviteMutation, useBlockUserMutation, useInvitePreviewQuery } from "@/services/social";
import type { PublicUser } from "@/services/users";

/** Opening someone's invite link or QR code: add them in one tap. */
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
          {shown ? (
            <TokenBody
              token={shown.token}
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
          confirmBlock(name, () =>
            block.mutate(user.id, {
              onSuccess: () => {
                showToast(`Blocked ${name}`);
                onClose();
              },
              onError: (error) =>
                showToast(getApiErrorMessage(error, "Couldn't block them.")),
            }),
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
  textButton: { minHeight: 44, justifyContent: "center", paddingHorizontal: 12 },
  notNow: { fontFamily: AddyFonts.body, fontSize: 16, color: AddyColors.inkMuted },
});
