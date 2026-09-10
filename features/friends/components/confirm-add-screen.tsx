import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import { UserAvatar, userDisplayName } from "@/components/ui/user-row";
import { AuthPrimaryButton } from "@/features/auth/components/auth-primary-button";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { friendActionsAlert } from "@/features/friends/components/friends-screen";
import { ScreenHeader } from "@/features/friends/components/screen-header";
import { setPendingInviteToken } from "@/features/friends/pending-invite";
import { getApiErrorMessage } from "@/lib/api/errors";
import {
  useBlockUserMutation,
  useResolveInviteQuery,
  useSendFriendRequestMutation,
} from "@/lib/query/hooks";

const RELATIONSHIP_COPY: Record<string, string> = {
  friend: "You're already friends.",
  request_sent: "Your friend request is pending.",
  request_received: "They've already sent you a request — check your requests.",
};

export function ConfirmAddScreen() {
  const params = useLocalSearchParams<{ token?: string }>();
  const token = typeof params.token === "string" ? params.token : undefined;
  const status = useAuthStore((s) => s.status);

  // Signed out: stash the token and bounce to sign-in; resumed after auth.
  useEffect(() => {
    if (token && status === "unauthenticated") {
      void setPendingInviteToken(token);
    }
  }, [token, status]);

  const resolve = useResolveInviteQuery(
    status === "authenticated" ? token : undefined,
  );
  const sendRequest = useSendFriendRequestMutation();
  const block = useBlockUserMutation();

  if (status === "hydrating" || status === "idle") {
    return <Centered><ActivityIndicator color={BrandColors.primary} /></Centered>;
  }
  if (status === "unauthenticated") {
    return <Redirect href="/sign-in" />;
  }
  if (!token) {
    return (
      <Screen>
        <Text style={styles.message}>This invite link is missing its code.</Text>
      </Screen>
    );
  }

  if (resolve.isLoading) {
    return <Screen><ActivityIndicator color={BrandColors.primary} /></Screen>;
  }
  if (resolve.isError || !resolve.data) {
    return (
      <Screen>
        <Text style={styles.message}>
          {getApiErrorMessage(
            resolve.error,
            "This invite link is no longer valid.",
          )}
        </Text>
      </Screen>
    );
  }

  const { user, relationship } = resolve.data;
  const alreadyConnected = relationship !== "none";
  const sent = sendRequest.isSuccess;

  return (
    <Screen>
      <UserAvatar user={user} size={88} />
      <Text style={styles.name}>{userDisplayName(user)}</Text>
      {user.username ? (
        <Text style={styles.handle}>@{user.username}</Text>
      ) : null}

      {sent ? (
        <Text style={styles.message}>Friend request sent!</Text>
      ) : alreadyConnected ? (
        <Text style={styles.message}>{RELATIONSHIP_COPY[relationship]}</Text>
      ) : (
        <AuthPrimaryButton
          label="Add friend"
          loading={sendRequest.isPending}
          onPress={() => sendRequest.mutate(user.id)}
        />
      )}

      {sendRequest.isError ? (
        <Text style={styles.error}>
          {getApiErrorMessage(sendRequest.error, "Could not send the request.")}
        </Text>
      ) : null}

      <AuthPrimaryButton
        label="Done"
        variant="secondary"
        onPress={() => router.replace("/(app)/friends")}
      />

      <Pressable
        onPress={() =>
          friendActionsAlert(user, {
            onBlock: () => {
              block.mutate(user.id);
              router.replace("/(app)/(tabs)");
            },
          })
        }
      >
        <Text style={styles.blockLink}>Block this user</Text>
      </Pressable>
    </Screen>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title="Add friend" fallback="/(app)/(tabs)" />
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.gray900 },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 32,
  },
  name: { fontSize: 22, fontWeight: "700", color: BrandColors.neutral },
  handle: { fontSize: 15, color: BrandColors.neutralMuted, marginTop: -8 },
  message: {
    fontSize: 15,
    color: BrandColors.neutralMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  error: { fontSize: 13, color: BrandColors.primary, textAlign: "center" },
  blockLink: {
    fontSize: 13,
    color: BrandColors.neutralMuted,
    paddingVertical: 8,
  },
});
