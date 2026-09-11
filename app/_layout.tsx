import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  useFonts,
} from "@expo-google-fonts/be-vietnam-pro";
import { PatrickHand_400Regular } from "@expo-google-fonts/patrick-hand";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { DarkTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import {
  TourGuideOverlay,
  TourGuideProvider,
} from "@wrack/react-native-tour-guide";

import { BrandColors } from "@/constants/theme";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { configureNotificationHandler } from "@/features/notifications/push-registration";
import { useNotificationRouter } from "@/features/notifications/use-notification-router";
import { queryClient } from "@/lib/query/client";

configureNotificationHandler();

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: BrandColors.primary,
    background: BrandColors.gray900,
    card: BrandColors.gray900,
    text: BrandColors.neutral,
    border: BrandColors.stroke2,
    notification: BrandColors.primary,
  },
};

SplashScreen.preventAutoHideAsync();

export function ErrorBoundary({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  console.error("[app] render error caught by ErrorBoundary", error);
  return (
    <View style={styles.boot}>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <Pressable onPress={retry}>
        <Text style={styles.errorRetry}>Try again</Text>
      </Pressable>
    </View>
  );
}

export default function RootLayout() {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);

  const [fontsLoaded] = useFonts({
    "BeVietnam-Regular": BeVietnamPro_400Regular,
    "BeVietnam-Medium": BeVietnamPro_500Medium,
    "BeVietnam-SemiBold": BeVietnamPro_600SemiBold,
    "BeVietnam-Bold": BeVietnamPro_700Bold,
    "PatrickHand-Regular": PatrickHand_400Regular,
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useNotificationRouter();

  useEffect(() => {
    if (fontsLoaded && status !== "idle" && status !== "hydrating") {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, status]);

  if (!fontsLoaded || status === "idle" || status === "hydrating") {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={navigationTheme}>
          <BottomSheetModalProvider>
            <TourGuideProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
                <Stack.Screen name="add-friend" />
                <Stack.Screen
                  name="modal"
                  options={{ presentation: "modal", title: "Modal" }}
                />
              </Stack>
              <StatusBar style="light" />
              <TourGuideOverlay />
            </TourGuideProvider>
          </BottomSheetModalProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  boot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BrandColors.gray900,
    padding: 24,
    gap: 16,
  },
  errorMessage: {
    textAlign: "center",
    color: BrandColors.neutral,
  },
  errorRetry: {
    color: BrandColors.primary,
    fontWeight: "600",
  },
});
