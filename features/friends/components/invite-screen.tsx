import { useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from "react-native-qrcode-svg";

import { BrandColors } from "@/constants/theme";
import { AuthPrimaryButton } from "@/features/auth/components/auth-primary-button";
import { ScreenHeader } from "@/features/friends/components/screen-header";
import { getApiErrorMessage } from "@/lib/api/errors";
import { useInviteQuery, useRotateInviteMutation } from "@/lib/query/hooks";

export function InviteScreen() {
  const query = useInviteQuery();
  const rotate = useRotateInviteMutation();

  const onShare = useCallback(() => {
    if (!query.data) return;
    void Share.share({
      message: `Add me on Addy: ${query.data.url}`,
    });
  }, [query.data]);

  const onRegenerate = useCallback(() => {
    Alert.alert(
      "New invite link?",
      "Your current QR code and link will stop working.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Regenerate",
          style: "destructive",
          onPress: () => rotate.mutate(),
        },
      ],
    );
  }, [rotate]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title="Your invite" fallback="/(app)/friends" />

      <View style={styles.body}>
        {query.isLoading || !query.data ? (
          <ActivityIndicator color={BrandColors.primary} />
        ) : (
          <>
            <Text style={styles.caption}>
              Have a friend scan this in Addy → Friends → scan.
            </Text>
            <View style={styles.qrCard}>
              <QRCode
                value={query.data.url}
                size={220}
                backgroundColor={BrandColors.paper}
                color={BrandColors.ink}
              />
            </View>
            <Text style={styles.code} selectable>
              {query.data.token}
            </Text>

            <AuthPrimaryButton label="Share link" onPress={onShare} />
            <Pressable onPress={onRegenerate} disabled={rotate.isPending}>
              <Text style={styles.regenerate}>
                {rotate.isPending ? "Regenerating…" : "Regenerate link"}
              </Text>
            </Pressable>
            {rotate.isError ? (
              <Text style={styles.error}>
                {getApiErrorMessage(rotate.error, "Could not regenerate.")}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.gray900 },
  body: { flex: 1, alignItems: "center", justifyContent: "center", gap: 18, padding: 32 },
  caption: {
    fontSize: 14,
    color: BrandColors.neutralMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  qrCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: BrandColors.paper,
  },
  code: {
    fontSize: 13,
    color: BrandColors.neutralMuted,
    fontFamily: "BeVietnam-Medium",
  },
  regenerate: {
    fontSize: 14,
    fontWeight: "600",
    color: BrandColors.primary,
    paddingVertical: 8,
  },
  error: { fontSize: 13, color: BrandColors.primary },
});
