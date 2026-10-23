import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlossyButton } from "@/components/ui/glossy-button";
import { UserAvatar, userDisplayName } from "@/components/ui/user-row";
import { AddyColors, AddyFonts } from "@/constants/theme";
import { markFriendCelebrated } from "@/features/friends/celebrated-friends";
import { useFriendSheetsStore } from "@/features/friends/store/friend-sheets-store";
import { useFriendsQuery, useProfileQuery } from "@/lib/query/hooks";
import type { PublicUser } from "@/types/api";

const AVATAR = 120;

/** "You and {name} are friends" after an add, an accept, or a push. */
export function FriendsCelebrationSheet() {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const target = useFriendSheetsStore((s) => s.celebrate);
  const closeCelebrate = useFriendSheetsStore((s) => s.closeCelebrate);
  const { data: profile } = useProfileQuery();
  const friendsQuery = useFriendsQuery();
  // Keep the last friend on screen while the sheet animates closed.
  const [friend, setFriend] = useState<PublicUser | null>(null);
  const [popKey, setPopKey] = useState(0);

  // A push only carries the id: look them up in the (refreshed) friends list.
  const fromList = target
    ? friendsQuery.data?.pages
        .flatMap((p) => p.items)
        .find((f) => f.user.id === target.userId)?.user
    : undefined;
  const resolved = target?.user ?? fromList;

  const { refetch } = friendsQuery;
  const [refreshedFor, setRefreshedFor] = useState<typeof target>(null);
  useEffect(() => {
    if (!target || target.user) return;
    void refetch().finally(() => setRefreshedFor(target));
  }, [target, refetch]);

  const presentedFor = useRef<typeof target>(null);
  useEffect(() => {
    if (!target || presentedFor.current === target) return;
    if (!resolved) {
      // Unknown (unfriended or blocked since): skip once the list is fresh.
      if (refreshedFor === target) closeCelebrate();
      return;
    }
    presentedFor.current = target;
    setFriend(resolved);
    setPopKey((k) => k + 1);
    void markFriendCelebrated(resolved.id);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    sheetRef.current?.present();
  }, [target, resolved, refreshedFor, closeCelebrate]);

  const close = useCallback(() => sheetRef.current?.dismiss(), []);

  const seeMap = () => {
    if (!friend) return;
    close();
    router.navigate({
      pathname: "/(app)/(tabs)/explore",
      params: { friend: friend.id },
    });
  };

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

  const name = friend ? userDisplayName(friend) : "";

  return (
    <BottomSheetModal
      ref={sheetRef}
      enablePanDownToClose
      topInset={insets.top}
      onDismiss={closeCelebrate}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
    >
      <BottomSheetView
        style={[styles.content, { paddingBottom: insets.bottom + 12 }]}
      >
        {friend ? (
          <>
            <View style={styles.avatars}>
              <View style={styles.ring}>
                {profile ? <UserAvatar user={profile} size={AVATAR} /> : null}
              </View>
              <View style={[styles.ring, styles.overlap]}>
                <UserAvatar user={friend} size={AVATAR} />
              </View>
              <Sparkle key={`a${popKey}`} glyph="✦" delay={120} style={styles.sparkleTopLeft} />
              <Sparkle key={`b${popKey}`} glyph="✧" delay={240} style={styles.sparkleBottomLeft} />
              <Sparkle key={`c${popKey}`} glyph="⭐" delay={360} style={styles.sparkleRight} />
            </View>

            <Text style={styles.title}>You and {name} are friends</Text>
            <Text style={styles.body}>
              You&apos;ll see each other&apos;s friends-only memories on the map.
            </Text>

            <GlossyButton
              label={`🗺️ See ${name}'s map`}
              onPress={seeMap}
              style={styles.stretch}
            />
            <Pressable
              onPress={close}
              accessibilityRole="button"
              hitSlop={6}
              style={styles.done}
            >
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </>
        ) : null}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

/** A sticker that pops in; static under Reduce Motion. */
function Sparkle({
  glyph,
  delay,
  style,
}: {
  glyph: string;
  delay: number;
  style: TextStyle;
}) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    scale.value = withDelay(delay, withSpring(1, { damping: 8, stiffness: 180 }));
  }, [scale, delay, reduceMotion]);

  const pop = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.Text
      style={[styles.sparkle, style, pop]}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {glyph}
    </Animated.Text>
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: AddyColors.paper },
  handleIndicator: { backgroundColor: AddyColors.line, width: 40 },
  content: { alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  stretch: { alignSelf: "stretch", marginTop: 12 },
  avatars: { flexDirection: "row", marginBottom: 6 },
  ring: {
    padding: 4,
    borderRadius: AVATAR / 2 + 6,
    borderWidth: 1.5,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  overlap: { marginLeft: -22 },
  sparkle: { position: "absolute", color: AddyColors.ink },
  sparkleTopLeft: { top: 2, left: -8, fontSize: 28 },
  sparkleBottomLeft: { bottom: 4, left: 40, fontSize: 20 },
  sparkleRight: { bottom: 18, right: -10, fontSize: 30 },
  title: {
    fontFamily: AddyFonts.title,
    fontSize: 26,
    lineHeight: 34,
    textAlign: "center",
    color: AddyColors.ink,
  },
  body: {
    fontFamily: AddyFonts.body,
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
    color: AddyColors.inkMuted,
  },
  done: { minHeight: 44, justifyContent: "center", paddingHorizontal: 16 },
  doneText: { fontFamily: AddyFonts.body, fontSize: 16, color: AddyColors.inkMuted },
});
