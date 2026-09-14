import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useCallback, useState } from "react";
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
import { safeBack } from "@/lib/navigation/safe-router";
import {
  useAcceptFriendRequestMutation,
  useDeclineFriendRequestMutation,
  useFriendRequestsQuery,
  useInviteQuery,
  useProfileQuery,
} from "@/lib/query/hooks";

type Tab = "qr" | "requests";

export function AddFriendsScreen() {
  const [tab, setTab] = useState<Tab>("qr");
  const { data: profile } = useProfileQuery();
  const inviteQuery = useInviteQuery();
  const requestsQuery = useFriendRequestsQuery("incoming");
  const accept = useAcceptFriendRequestMutation();
  const decline = useDeclineFriendRequestMutation();
  const requests = requestsQuery.data?.pages.flatMap((p) => p.items) ?? [];

  const onShare = useCallback(() => {
    if (!inviteQuery.data) return;
    void Share.share({ message: `Add me on Addy: ${inviteQuery.data.url}` });
  }, [inviteQuery.data]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={() => safeBack("/(app)/friends")}
          hitSlop={12}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back to friends"
        >
          <Ionicons name="chevron-back" size={22} color={BrandColors.ink} />
          <Text style={styles.headerTitle}>Add friends</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/(app)/friends/scan")}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Scan a friend's QR code"
        >
          <Ionicons name="scan-outline" size={22} color={BrandColors.ink} />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === "qr" && styles.tabActive]}
          onPress={() => setTab("qr")}
        >
          <Text style={[styles.tabLabel, tab === "qr" && styles.tabLabelActive]}>
            My QR
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === "requests" && styles.tabActive]}
          onPress={() => setTab("requests")}
        >
          <Text
            style={[styles.tabLabel, tab === "requests" && styles.tabLabelActive]}
          >
            Requests
          </Text>
          {requests.length > 0 ? (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{requests.length}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      {tab === "qr" ? (
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
      ) : requestsQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={BrandColors.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <UserRow
              user={item.user}
              right={
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() => accept.mutate(item.id)}
                    style={styles.acceptBtn}
                    accessibilityLabel="Accept request"
                  >
                    <Text style={styles.acceptBtnText}>✓</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => decline.mutate(item.id)}
                    style={styles.declineBtn}
                    accessibilityLabel="Decline request"
                  >
                    <Text style={styles.declineBtnText}>✕</Text>
                  </Pressable>
                </View>
              }
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No incoming requests.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.paper },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 2 },
  headerTitle: {
    fontFamily: "Fredoka-Bold",
    fontSize: 20,
    color: BrandColors.ink,
  },
  tabs: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
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
  tabBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: BrandColors.accentPink,
    borderWidth: 1.5,
    borderColor: BrandColors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: BrandColors.white,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
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
  list: { paddingHorizontal: 16, paddingBottom: 40, flexGrow: 1 },
  rowActions: { flexDirection: "row", gap: 8 },
  acceptBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: BrandColors.ink,
    backgroundColor: BrandColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtnText: { color: BrandColors.ink, fontWeight: "700", fontSize: 14 },
  declineBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: BrandColors.ink,
    backgroundColor: BrandColors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
  declineBtnText: { color: BrandColors.ink, fontWeight: "700", fontSize: 14 },
  empty: {
    color: BrandColors.inkMuted,
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 40,
  },
});
