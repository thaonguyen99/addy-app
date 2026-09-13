import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet } from "react-native";
import { TourTarget } from "@wrack/react-native-tour-guide";

import { HapticTab } from "@/components/haptic-tab";
import { ChunkyNavIcon } from "@/components/ui/chunky-nav-icon";
import { BrandColors } from "@/constants/theme";
import { ONBOARDING_ADD_MEMORY_STEP_ID } from "@/features/onboarding/onboarding-tour";

// Deliberately outside the paper palette — the tab bar reads as device
// chrome (like a physical dock), not another paper surface.
const DOCK_GRADIENT: [string, string] = ["#E9E9E9", "#CFCFCF"];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopColor: BrandColors.neutralBorder,
          borderTopWidth: 3,
        },
        tabBarBackground: () => (
          <LinearGradient
            colors={DOCK_GRADIENT}
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarItemStyle: { paddingTop: 10 },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => <ChunkyNavIcon name="house.fill" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          tabBarIcon: ({ focused }) => <ChunkyNavIcon name="camera.fill" active={focused} />,
          tabBarButton: (props) => (
            <TourTarget
              id={ONBOARDING_ADD_MEMORY_STEP_ID}
              style={{ flex: 1, borderRadius: 16 }}
            >
              <HapticTab {...props} />
            </TourTarget>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused }) => <ChunkyNavIcon name="paperplane.fill" active={focused} />,
        }}
      />
    </Tabs>
  );
}
