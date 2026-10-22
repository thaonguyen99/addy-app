import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { type ComponentProps, useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef } from "react-native-view-shot";

import { IconCircleButton } from "@/components/ui/icon-circle-button";
import { SkyBackground } from "@/components/ui/sky-background";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";
import { useMemoryFeed } from "@/features/feed/hooks/use-memory-feed";
import {
  InviteStoryCard,
  STORY_HEIGHT,
  STORY_WIDTH,
} from "@/features/invite/components/invite-story-card";
import { MiniPinMap } from "@/features/invite/components/mini-pin-map";
import { getPinColor } from "@/features/map/utils/pin-color";
import { showToast } from "@/features/toast/toast-store";
import { safeBack } from "@/lib/navigation/safe-router";
import { useInviteQuery, useProfileQuery, useStatsQuery } from "@/lib/query/hooks";

type IconName = ComponentProps<typeof Ionicons>["name"];

type ShareTarget = {
  key: string;
  label: string;
  color: string;
  icon?: IconName;
  glyph?: string;
  onPress: () => void;
};

/** Invite friends: link + share grid + a postable story image. */
export function InviteScreen() {
  const { width } = useWindowDimensions();
  const { data: profile } = useProfileQuery();
  const { data: stats } = useStatsQuery();
  const inviteQuery = useInviteQuery();
  const { items: memories } = useMemoryFeed(true);
  const storyRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);

  const link = inviteQuery.data?.webUrl ?? "";
  const username = profile?.username ?? "";
  const message = `Come pin memories with me on Addy ✦ ${link}`;
  const pinColors = useMemo(
    () => memories.slice(0, 14).map((memory) => getPinColor(memory)),
    [memories],
  );

  const copyLink = useCallback(async () => {
    if (!link) return;
    await Clipboard.setStringAsync(link);
    showToast("Copied");
  }, [link]);

  const shareLink = useCallback(() => {
    if (!link) return;
    void Share.share({ message });
  }, [link, message]);

  const sendSms = useCallback(() => {
    if (!link) return;
    // iOS separates the body with "&", Android with "?".
    const separator = Platform.OS === "ios" ? "&" : "?";
    Linking.openURL(`sms:${separator}body=${encodeURIComponent(message)}`).catch(
      shareLink,
    );
  }, [link, message, shareLink]);

  const captureStory = useCallback(async () => {
    if (!storyRef.current) return null;
    return captureRef(storyRef, {
      format: "png",
      quality: 1,
      width: 1080,
      height: 1920,
      result: "tmpfile",
    });
  }, []);

  const shareStory = useCallback(async () => {
    if (!link || busy) return;
    setBusy(true);
    try {
      const uri = await captureStory();
      if (!uri) return;
      if (!(await Sharing.isAvailableAsync())) {
        shareLink();
        return;
      }
      // The system sheet lists Instagram/TikTok Stories when installed.
      await Sharing.shareAsync(uri, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle: "Share your Addy invite",
      });
    } catch (error) {
      console.warn("[invite] story share failed", error);
      showToast("Couldn't make the story image.");
    } finally {
      setBusy(false);
    }
  }, [link, busy, captureStory, shareLink]);

  const saveStory = useCallback(async () => {
    if (!link || busy) return;
    setBusy(true);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync(true);
      if (!permission.granted) {
        Alert.alert(
          "Save story",
          "Allow Addy to add photos in Settings to save the story image.",
        );
        return;
      }
      const uri = await captureStory();
      if (!uri) return;
      await MediaLibrary.saveToLibraryAsync(uri);
      showToast("Saved to Photos");
    } catch (error) {
      console.warn("[invite] story save failed", error);
      showToast("Couldn't save the story image.");
    } finally {
      setBusy(false);
    }
  }, [link, busy, captureStory]);

  const targets: ShareTarget[] = [
    { key: "zalo", label: "Zalo", color: "#0068FF", glyph: "Z", onPress: shareLink },
    { key: "messenger", label: "Messenger", color: "#A033FF", icon: "chatbubble-ellipses", onPress: shareLink },
    { key: "instagram", label: "Instagram", color: AddyColors.pink, icon: "logo-instagram", onPress: () => void shareStory() },
    { key: "tiktok", label: "TikTok", color: AddyColors.ink, icon: "logo-tiktok", onPress: () => void shareStory() },
    { key: "sms", label: "SMS", color: "#34C759", icon: "chatbox", onPress: sendSms },
    { key: "save", label: "Save story", color: AddyColors.yellow, icon: "download", onPress: () => void saveStory() },
    { key: "copy", label: "Copy link", color: AddyColors.cyan, icon: "link", onPress: () => void copyLink() },
    { key: "more", label: "More", color: AddyColors.paperDim, icon: "ellipsis-horizontal", onPress: shareLink },
  ];

  const cardWidth = width - 32;

  return (
    <SkyBackground>
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <IconCircleButton
            icon="chevron-back"
            accessibilityLabel="Back"
            onPress={() => safeBack("/(app)/(tabs)")}
          />
          <Text style={styles.title}>Invite friends</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.window, AddyShadow.soft]}>
            <View style={styles.titleBar}>
              <View style={[styles.dot, { backgroundColor: AddyColors.pink }]} />
              <View style={[styles.dot, { backgroundColor: AddyColors.yellow }]} />
              <View style={[styles.dot, { backgroundColor: AddyColors.lime }]} />
              <Text style={styles.titleBarText}>invite.exe</Text>
            </View>
            <View style={styles.windowBody}>
              <Text style={styles.pitch}>Your map is better with friends on it</Text>
              <MiniPinMap
                colors={pinColors}
                seed={username || "addy"}
                width={cardWidth - 28}
                height={(cardWidth - 28) * 0.55}
              />
            </View>
          </View>

          <View style={[styles.linkRow, AddyShadow.soft]}>
            {inviteQuery.isLoading ? (
              <ActivityIndicator color={AddyColors.ink} style={styles.flex} />
            ) : (
              <Text style={styles.link} numberOfLines={1}>
                {link.replace(/^https?:\/\//, "") || "invite link unavailable"}
              </Text>
            )}
            <Pressable
              onPress={() => void copyLink()}
              disabled={!link}
              accessibilityRole="button"
              accessibilityLabel="Copy invite link"
              style={({ pressed }) => [styles.copy, pressed && styles.pressed]}
            >
              <Text style={styles.copyText}>Copy</Text>
            </Pressable>
          </View>

          <View style={styles.grid}>
            {targets.map((target) => (
              <Pressable
                key={target.key}
                onPress={target.onPress}
                disabled={!link || busy}
                accessibilityRole="button"
                accessibilityLabel={target.label}
                style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
              >
                <View style={[styles.cellOrb, { backgroundColor: target.color }]}>
                  <View style={styles.cellShine} />
                  {target.icon ? (
                    <Ionicons
                      name={target.icon}
                      size={22}
                      color={target.key === "more" || target.key === "save" ? AddyColors.ink : AddyColors.white}
                    />
                  ) : (
                    <Text style={styles.cellGlyph}>{target.glyph}</Text>
                  )}
                </View>
                <Text style={styles.cellLabel} numberOfLines={1}>
                  {target.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {busy ? <ActivityIndicator color={AddyColors.ink} /> : null}
        </ScrollView>

        {/* Off-screen: only rendered to be captured as the story image. */}
        <View style={styles.offscreen} pointerEvents="none">
          <InviteStoryCard
            ref={storyRef}
            username={username}
            placesCount={stats?.placesVisited ?? 0}
            pinColors={pinColors}
            link={link}
          />
        </View>
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontFamily: AddyFonts.title,
    fontSize: 20,
    lineHeight: 30,
    color: AddyColors.ink,
  },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 40, gap: 16 },
  window: {
    borderRadius: AddyRadius.card,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
    overflow: "hidden",
  },
  titleBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: AddyColors.paperDim,
    borderBottomWidth: ADDY_BORDER_WIDTH,
    borderBottomColor: AddyColors.line,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  titleBarText: {
    marginLeft: 6,
    fontFamily: AddyFonts.tech,
    fontSize: 17,
    color: AddyColors.inkMuted,
  },
  windowBody: { padding: 14, gap: 12 },
  pitch: {
    fontFamily: AddyFonts.title,
    fontSize: 20,
    lineHeight: 28,
    color: AddyColors.ink,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: AddyRadius.input,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  link: { flex: 1, fontFamily: AddyFonts.tech, fontSize: 18, color: AddyColors.ink },
  copy: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: AddyRadius.pill,
    backgroundColor: AddyColors.lime,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.limeDeep,
  },
  copyText: { fontFamily: AddyFonts.title, fontSize: 14, color: AddyColors.ink },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 16 },
  cell: { width: "25%", alignItems: "center", gap: 6 },
  cellOrb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
  },
  cellShine: {
    position: "absolute",
    top: 4,
    left: 9,
    width: 24,
    height: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
  },
  cellGlyph: { fontFamily: AddyFonts.title, fontSize: 22, color: AddyColors.white },
  cellLabel: { fontFamily: AddyFonts.bodyMedium, fontSize: 12, color: AddyColors.ink },
  pressed: { opacity: 0.75 },
  offscreen: {
    position: "absolute",
    left: -STORY_WIDTH * 3,
    top: 0,
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
  },
});
