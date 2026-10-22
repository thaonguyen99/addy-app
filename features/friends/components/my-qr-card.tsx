import { router } from "expo-router";
import { useCallback } from "react";
import { ActivityIndicator, Share, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { GlossyButton } from "@/components/ui/glossy-button";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";
import { useInviteQuery, useProfileQuery } from "@/lib/query/hooks";

/** Your invite QR in a white card, plus Share and Invite friends. */
export function MyQrCard() {
  const { data: profile } = useProfileQuery();
  const inviteQuery = useInviteQuery();
  const invite = inviteQuery.data;

  const onShare = useCallback(() => {
    if (!invite) return;
    // The landing page works for people without the app; the deep link
    // (encoded in the QR) only opens Addy itself.
    void Share.share({ message: `Add me on Addy: ${invite.webUrl}` });
  }, [invite]);

  if (inviteQuery.isLoading || !invite) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={AddyColors.ink} />
      </View>
    );
  }

  return (
    <View style={styles.body}>
      <View>
        <Text style={styles.star}>✦</Text>
        <View style={[styles.card, AddyShadow.soft]}>
          <QRCode
            value={invite.url}
            size={184}
            backgroundColor={AddyColors.white}
            color={AddyColors.ink}
          />
          {profile ? (
            <Text style={styles.username}>@{profile.username}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.buttons}>
        <GlossyButton label="🔗 Share my QR" onPress={onShare} />
        <GlossyButton
          label="💌 Invite friends"
          variant="secondary"
          onPress={() => router.push("/invite")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 60, alignItems: "center" },
  body: { alignItems: "center", gap: 24, paddingTop: 12 },
  star: {
    position: "absolute",
    top: -16,
    right: -8,
    zIndex: 1,
    fontSize: 26,
    color: AddyColors.yellow,
    transform: [{ rotate: "15deg" }],
  },
  card: {
    padding: 22,
    alignItems: "center",
    gap: 12,
    borderRadius: AddyRadius.card,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  username: {
    fontFamily: AddyFonts.title,
    fontSize: 17,
    lineHeight: 24,
    color: AddyColors.ink,
  },
  buttons: { alignSelf: "stretch", gap: 10 },
});
