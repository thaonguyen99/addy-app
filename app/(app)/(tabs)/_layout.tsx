import { Tabs } from "expo-router";
import React from "react";

import { FloatingTabBar } from "@/components/navigation/floating-tab-bar";
import { TAB_SLIDE, TabSwipe } from "@/components/navigation/tab-swipe";

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="explore"
      tabBar={(props) => <FloatingTabBar {...props} />}
      // Slide between tabs, whether tapped or swiped.
      screenOptions={{ headerShown: false, ...TAB_SLIDE }}
      screenLayout={({ route, children }) => (
        <TabSwipe
          routeName={route.name}
          // The map pans and Lane's photos page sideways: edge swipes only.
          edgeOnly={route.name === "explore" || route.name === "lane"}
        >
          {children}
        </TabSwipe>
      )}
    >
      <Tabs.Screen name="lane" options={{ title: "Memory Lane" }} />
      <Tabs.Screen name="explore" options={{ title: "Map" }} />
      <Tabs.Screen name="notifications" options={{ title: "Notifications" }} />
      <Tabs.Screen name="index" options={{ title: "You" }} />
    </Tabs>
  );
}
