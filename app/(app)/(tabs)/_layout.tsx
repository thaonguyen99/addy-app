import { Tabs } from "expo-router";
import React from "react";
import { TourTarget } from "@wrack/react-native-tour-guide";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BrandColors } from "@/constants/theme";
import { ONBOARDING_ADD_MEMORY_STEP_ID } from "@/features/onboarding/onboarding-tour";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: BrandColors.primary,
        tabBarInactiveTintColor: BrandColors.neutralMuted,
        tabBarStyle: {
          backgroundColor: BrandColors.gray900,
          borderTopColor: BrandColors.neutralBorder,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: "Camera",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="camera.fill" color={color} />
          ),
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
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
