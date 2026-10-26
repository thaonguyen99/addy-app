import * as Sharing from "expo-sharing";
import { type ReactNode, useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { captureRef } from "react-native-view-shot";

import { useMemoryFeed } from "@/services/memories";
import {
  InviteStoryCard,
  STORY_HEIGHT,
  STORY_WIDTH,
} from "@/features/invite/components/invite-story-card";
import { shareInviteLink } from "@/features/invite/share-invite";
import { getPinColor } from "@/utils/pin-color";
import { showToast } from "@/stores/toast.store";
import { useProfileQuery, useStatsQuery } from "@/services/users";

/**
 * The postable story image. Render `storyElement` somewhere on screen (it sits
 * off-screen) and call `shareStory` — the system sheet lists Instagram/TikTok
 * Stories when installed.
 */
export function useInviteStory(link: string): {
  storyElement: ReactNode;
  shareStory: () => Promise<void>;
  busy: boolean;
} {
  const { data: profile } = useProfileQuery();
  const { data: stats } = useStatsQuery();
  const { items: memories } = useMemoryFeed(true);
  const storyRef = useRef<View>(null);
  const [busy, setBusy] = useState(false);

  const pinColors = useMemo(
    () => memories.slice(0, 14).map((memory) => getPinColor(memory)),
    [memories],
  );

  const shareStory = useCallback(async () => {
    if (!link || busy || !storyRef.current) return;
    setBusy(true);
    try {
      const uri = await captureRef(storyRef, {
        format: "png",
        quality: 1,
        width: 1080,
        height: 1920,
        result: "tmpfile",
      });
      if (!(await Sharing.isAvailableAsync())) {
        shareInviteLink(link);
        return;
      }
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
  }, [link, busy]);

  const storyElement = (
    <View style={styles.offscreen} pointerEvents="none">
      <InviteStoryCard
        ref={storyRef}
        username={profile?.username ?? ""}
        placesCount={stats?.placesVisited ?? 0}
        pinColors={pinColors}
        link={link}
      />
    </View>
  );

  return { storyElement, shareStory, busy };
}

const styles = StyleSheet.create({
  offscreen: {
    position: "absolute",
    left: -STORY_WIDTH * 3,
    top: 0,
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
  },
});
