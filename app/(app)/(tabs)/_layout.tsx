import { Tabs } from "expo-router";
import React from "react";

import { FloatingTabBar } from "@/components/navigation/floating-tab-bar";

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="explore"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="lane" options={{ title: "Memory Lane" }} />
      <Tabs.Screen name="explore" options={{ title: "Map" }} />
      <Tabs.Screen name="friends" options={{ title: "Friends" }} />
      <Tabs.Screen name="index" options={{ title: "You" }} />
    </Tabs>
  );
}
