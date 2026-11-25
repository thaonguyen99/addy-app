import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { BackHandler, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import { useOtaUpdate } from "@/hooks/use-ota-update";

export function MaintenanceScreen() {
  useOtaUpdate();

  useEffect(() => {
    const backPress = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => backPress.remove();
  }, []);

  return (
    <SafeAreaView style={styles.screen} onLayout={SplashScreen.hide}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.brand}>Addy</Text>
          <Text accessibilityRole="header" style={styles.title}>
            We’re under maintenance
          </Text>
          <Text style={styles.message}>
            Our system is temporarily unavailable while we work on it. Please
            check back later.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BrandColors.paper },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    alignItems: "flex-start",
    gap: 16,
    padding: 24,
    borderWidth: 2,
    borderRadius: 24,
    borderColor: BrandColors.ink,
    backgroundColor: BrandColors.white,
  },
  brand: {
    backgroundColor: BrandColors.primaryLight,
    color: BrandColors.ink,
    borderRadius: 10,
    overflow: "hidden",
    paddingHorizontal: 12,
    paddingVertical: 5,
    fontSize: 17,
    fontWeight: "800",
  },
  title: {
    color: BrandColors.ink,
    fontSize: 34,
    fontWeight: "800",
  },
  message: {
    color: BrandColors.inkMuted,
    fontSize: 17,
  },
});
