import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { useRef } from "react";
import {
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import { AuthPrimaryButton } from "@/features/auth/components/auth-primary-button";
import { ScreenHeader } from "@/features/friends/components/screen-header";

/** Pull the `token` param out of an addyapp://add-friend?token=... deep link. */
function tokenFromScan(value: string): string | null {
  try {
    const url = new URL(value);
    return url.searchParams.get("token");
  } catch {
    const match = value.match(/[?&]token=([^&]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : null;
  }
}

export function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);

  const onScanned = (raw: string) => {
    if (handled.current) return;
    const token = tokenFromScan(raw);
    if (!token) return;
    handled.current = true;
    router.replace({ pathname: "/add-friend", params: { token } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title="Scan invite" fallback="/(app)/friends" />
      <View style={styles.body}>
        {!permission ? null : !permission.granted ? (
          <View style={styles.denied}>
            <Text style={styles.deniedText}>
              Addy needs camera access to scan an invite QR code.
            </Text>
            {permission.canAskAgain ? (
              <AuthPrimaryButton
                label="Allow camera"
                onPress={() => void requestPermission()}
              />
            ) : (
              <Pressable onPress={() => void Linking.openSettings()}>
                <Text style={styles.settingsLink}>Open Settings</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => onScanned(data)}
          >
            <View style={styles.reticle} />
            <Text style={styles.hint}>
              Point at a friend&apos;s Addy QR code
            </Text>
          </CameraView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.gray900 },
  body: { flex: 1 },
  camera: { flex: 1, alignItems: "center", justifyContent: "center" },
  reticle: {
    width: 220,
    height: 220,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: BrandColors.white,
  },
  hint: {
    marginTop: 20,
    color: BrandColors.white,
    fontSize: 14,
    fontWeight: "600",
  },
  denied: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 32,
  },
  deniedText: {
    color: BrandColors.neutralMuted,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },
  settingsLink: {
    color: BrandColors.primary,
    fontWeight: "600",
    fontSize: 15,
  },
});
