import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CameraUi } from "@/features/camera/constants/layout";
import { sharedInteractionStyles } from "@/features/camera/styles/shared-styles";
import { BrandColors } from "@/constants/theme";

type PendingProps = Readonly<{ variant: "pending" }>;

type DeniedProps = Readonly<{
  variant: "denied";
  canAskAgain: boolean;
  onRequestAccess: () => void;
}>;

/** Native camera + permissions are unreliable in browser preview; steer devs to device. */
type WebProps = Readonly<{ variant: "web" }>;

export type CameraPermissionGatePanelProps =
  | PendingProps
  | DeniedProps
  | WebProps;

export function CameraPermissionGatePanel(
  props: CameraPermissionGatePanelProps,
) {
  if (props.variant === "web") {
    return (
      <SafeAreaView style={styles.safeDark} edges={["top", "bottom"]}>
        <View style={styles.fillDark}>
          <MaterialIcons
            name="smartphone"
            size={56}
            color={BrandColors.softLilac}
          />
          <Text style={styles.permissionTitle}>Camera on your phone</Text>
          <Text style={styles.permissionBody}>
            The Addy camera uses native Expo Camera and does not run in the
            browser preview. Open this project in Expo Go (or a dev build) on
            iOS or Android to use capture and permissions.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (props.variant === "pending") {
    return (
      <View style={styles.fillDark}>
        <ActivityIndicator size="large" color={BrandColors.primaryPink} />
        <Text style={styles.mutedLight}>Checking camera…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeDark} edges={["top", "bottom"]}>
      <View style={styles.fillDark}>
        <MaterialIcons
          name="photo-camera"
          size={56}
          color={BrandColors.softLilac}
        />
        <Text style={styles.permissionTitle}>Camera access</Text>
        <Text style={styles.permissionBody}>
          Addy uses your camera for quick, honest memories tied to places.
          Nothing extra — just the moment.
        </Text>
        {props.canAskAgain ? (
          <Pressable
            onPress={props.onRequestAccess}
            style={({ pressed }) => [
              sharedInteractionStyles.primaryCta,
              styles.allowBtnSpacing,
              pressed && sharedInteractionStyles.pressedSubtle,
            ]}
          >
            <Text style={sharedInteractionStyles.primaryCtaText}>
              Allow camera
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.mutedLight}>
            Enable camera for Addy in your device settings.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeDark: {
    flex: 1,
    backgroundColor: CameraUi.screenBg,
  },
  fillDark: {
    ...sharedInteractionStyles.centerContent,
    paddingHorizontal: 32,
    gap: 14,
    backgroundColor: CameraUi.screenBg,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: BrandColors.white,
    textAlign: "center",
  },
  permissionBody: {
    fontSize: 15,
    color: BrandColors.gray300,
    textAlign: "center",
    lineHeight: 22,
  },
  mutedLight: {
    fontSize: 14,
    color: BrandColors.gray500,
    textAlign: "center",
  },
  allowBtnSpacing: {
    marginTop: 8,
    paddingHorizontal: 28,
  },
});
