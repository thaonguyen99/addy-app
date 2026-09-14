import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { ChunkyNavIcon } from "@/components/ui/chunky-nav-icon";
import {
  TAB_BAR_DOCK_PADDING as DOCK_PADDING,
  TAB_BAR_ICON_SIZE as ICON_SIZE,
} from "@/constants/tab-bar";
import { BrandColors } from "@/constants/theme";

// Deliberately outside the paper palette — the tab bar reads as device
// chrome (like a physical dock), not another paper surface.
const DOCK_GRADIENT: [string, string] = ["#E9E9E9", "#CFCFCF"];

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopColor: BrandColors.neutralBorder,
          borderTopWidth: 3,
          height: DOCK_PADDING * 2 + ICON_SIZE + insets.bottom,
          paddingTop: DOCK_PADDING,
          paddingBottom: insets.bottom,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={DOCK_GRADIENT}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarItemStyle: { paddingVertical: 0 },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <ChunkyNavIcon name="house.fill" active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          tabBarIcon: ({ focused }) => (
            <ChunkyNavIcon name="camera.fill" active={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused }) => (
            <ChunkyNavIcon name="map.fill" active={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
