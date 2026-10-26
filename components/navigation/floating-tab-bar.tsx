import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { TourTarget } from "@wrack/react-native-tour-guide";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { memo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlossyOrb } from "@/components/ui/glossy-orb";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyGradients,
  AddyShadow,
} from "@/constants/theme";
import { useAuthStore } from "@/stores/auth.store";
import { ONBOARDING_ADD_FRIEND_TARGET_ID } from "@/features/onboarding/onboarding-tour";

export const TAB_BAR_HEIGHT = 52;
const TAB_BAR_INSET = 12;
const ORB_SIZE = 62;
const ORB_RING = 4;
const ORB_RAISE = 24;

/** Bottom padding a tab screen needs so its content clears the floating bar. */
export function useFloatingTabBarInset() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + TAB_BAR_INSET * 2 + insets.bottom;
}

type TabSlot = { route: string; emoji: string; label: string };

const LEFT_SLOTS: TabSlot[] = [
  { route: "lane", emoji: "🎞️", label: "Memory Lane" },
  { route: "explore", emoji: "🗺️", label: "Map" },
];
const RIGHT_SLOTS: TabSlot[] = [
  { route: "friends", emoji: "👥", label: "Friends" },
  { route: "index", emoji: "", label: "You" },
];

function tapHaptic() {
  if (Platform.OS === "ios") {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/**
 * Floating pill tab bar: Memory Lane · Map · [camera orb] · Friends · You.
 * The orb isn't a tab — it opens the full-screen capture route.
 */
export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  const renderSlot = (slot: TabSlot) => {
    const index = state.routes.findIndex((r) => r.name === slot.route);
    if (index === -1) return null;
    const route = state.routes[index];
    const focused = state.index === index;

    const onPress = () => {
      tapHaptic();
      const event = navigation.emit({
        type: "tabPress",
        target: route.key,
        canPreventDefault: true,
      });
      if (!focused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const button = (
      <Pressable
        key={slot.route}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityLabel={slot.label}
        accessibilityState={{ selected: focused }}
        style={styles.slot}
      >
        {slot.route === "index" ? (
          <AvatarIcon focused={focused} />
        ) : (
          <View style={[styles.bubble, focused && styles.bubbleActive]}>
            <Text style={styles.emoji}>{slot.emoji}</Text>
          </View>
        )}
      </Pressable>
    );

    if (slot.route === "friends") {
      return (
        <TourTarget
          key={slot.route}
          id={ONBOARDING_ADD_FRIEND_TARGET_ID}
          style={styles.slot}
        >
          {button}
        </TourTarget>
      );
    }
    return button;
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: TAB_BAR_INSET + insets.bottom }]}
    >
      <View style={[styles.bar, AddyShadow.raised]}>
        <LinearGradient
          colors={AddyGradients.tabBar}
          style={[StyleSheet.absoluteFill, styles.barFill]}
        />
        {LEFT_SLOTS.map(renderSlot)}
        <View style={styles.slot} pointerEvents="box-none">
          <Pressable
            onPress={() => {
              tapHaptic();
              router.push("/capture");
            }}
            accessibilityRole="button"
            accessibilityLabel="Open camera"
            style={styles.orbButton}
          >
            <GlossyOrb size={ORB_SIZE} ringWidth={ORB_RING} style={AddyShadow.raised}>
              <Text style={styles.orbIcon}>📷</Text>
            </GlossyOrb>
          </Pressable>
        </View>
        {RIGHT_SLOTS.map(renderSlot)}
      </View>
    </View>
  );
}

const AvatarIcon = memo(function AvatarIcon({ focused }: { focused: boolean }) {
  const avatarUrl = useAuthStore((s) => s.user?.avatarUrl);
  const initial = useAuthStore(
    (s) => (s.user?.name || s.user?.username || "?").charAt(0).toUpperCase(),
  );

  return (
    <View style={[styles.avatarRing, focused && styles.avatarRingActive]}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      )}
    </View>
  );
});

const ORB_OUTER = ORB_SIZE + ORB_RING * 2;

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: TAB_BAR_INSET,
    right: TAB_BAR_INSET,
  },
  bar: {
    height: TAB_BAR_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: TAB_BAR_HEIGHT / 2,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  barFill: { borderRadius: TAB_BAR_HEIGHT / 2 },
  slot: {
    flex: 1,
    height: TAB_BAR_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    width: 44,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleActive: { backgroundColor: AddyColors.lime },
  emoji: { fontSize: 20 },
  orbButton: {
    position: "absolute",
    top: -ORB_RAISE,
    width: ORB_OUTER,
    height: ORB_OUTER,
  },
  orbIcon: { fontSize: 24 },
  avatarRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    padding: 2,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
  },
  avatarRingActive: {
    borderWidth: 2.5,
    borderColor: AddyColors.limeDeep,
    backgroundColor: AddyColors.lime,
  },
  avatar: { flex: 1, borderRadius: 999 },
  avatarFallback: {
    backgroundColor: AddyColors.paperDim,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontFamily: AddyFonts.title,
    fontSize: 13,
    color: AddyColors.ink,
  },
});
