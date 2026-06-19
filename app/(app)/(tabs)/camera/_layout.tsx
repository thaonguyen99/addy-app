import { Stack } from "expo-router";

import { BrandColors } from "@/constants/theme";

export default function CameraStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: BrandColors.gray900 },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="photo-selection"
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="place-selection"
        options={{
          presentation: "modal",
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}
