import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { CameraView, scanFromURLAsync, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlossyButton } from "@/components/ui/glossy-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { UserAvatar } from "@/components/ui/user-row";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyShadow,
} from "@/constants/theme";
import { parseInviteToken } from "@/features/friends/invite-link";
import {
  openInvite,
  type QrSide,
  useFriendSheetsStore,
} from "@/stores/friend-sheets.store";
import { shareInviteLink } from "@/features/invite/share-invite";
import { showToast } from "@/stores/toast.store";
import { getApiErrorMessage } from "@/services/api/errors";
import { useInviteQuery, useRotateInviteMutation } from "@/services/social";
import { useProfileQuery } from "@/services/users";

const SIDES = [
  { value: "code", label: "My code" },
  { value: "scan", label: "Scan" },
] as const;

const QR_SIZE = 220;
const SCANNER_SIZE = 280;

/** My code | Scan. Opened through `useFriendSheetsStore().openQr()`. */
export function QrSheet() {
  const insets = useSafeAreaInsets();
  const sheetRef = useRef<BottomSheetModal>(null);
  const requested = useFriendSheetsStore((s) => s.qr);
  const closeQr = useFriendSheetsStore((s) => s.closeQr);
  const [side, setSide] = useState<QrSide>("code");
  const [codeHeight, setCodeHeight] = useState(0);
  const [scanHeight, setScanHeight] = useState(0);
  const sideHeight = Math.max(codeHeight, scanHeight);

  useEffect(() => {
    if (!requested) return;
    setSide(requested);
    sheetRef.current?.present();
  }, [requested]);

  const onScanned = useCallback((token: string) => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    sheetRef.current?.dismiss();
    openInvite(token);
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      enablePanDownToClose
      topInset={insets.top}
      onDismiss={closeQr}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
    >
      <BottomSheetView
        style={[styles.content, { paddingBottom: insets.bottom + 16 }]}
      >
        <SegmentedControl options={SIDES} value={side} onChange={setSide} />
        {/* Both sides stay rendered and the frame keeps the taller one's
            height, so switching sides doesn't resize the sheet. */}
        <View style={{ minHeight: sideHeight }}>
          <SidePane visible={side === "code"} onHeight={setCodeHeight}>
            <MyCode />
          </SidePane>
          <SidePane visible={side === "scan"} onHeight={setScanHeight}>
            <Scanner
              visible={side === "scan"}
              active={requested !== null && side === "scan"}
              onScanned={onScanned}
            />
          </SidePane>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

/** The hidden side is laid out off-flow and invisible, but still measured. */
function SidePane({
  visible,
  onHeight,
  children,
}: {
  visible: boolean;
  onHeight: (height: number) => void;
  children: React.ReactNode;
}) {
  return (
    <View
      onLayout={(e) => onHeight(e.nativeEvent.layout.height)}
      pointerEvents={visible ? "auto" : "none"}
      importantForAccessibility={visible ? "auto" : "no-hide-descendants"}
      accessibilityElementsHidden={!visible}
      style={visible ? undefined : styles.hiddenPane}
    >
      {children}
    </View>
  );
}

function MyCode() {
  const { data: profile } = useProfileQuery();
  const inviteQuery = useInviteQuery();
  const rotate = useRotateInviteMutation();
  const link = inviteQuery.data?.webUrl ?? "";

  const confirmReset = () =>
    Alert.alert(
      "Reset your code and link?",
      "Your old QR and links will stop working.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () =>
            rotate.mutate(undefined, {
              onSuccess: () => showToast("New code ready"),
              onError: (error) =>
                showToast(getApiErrorMessage(error, "Couldn't reset your code.")),
            }),
        },
      ],
    );

  return (
    <View style={styles.side}>
      <View style={[styles.qrCard, AddyShadow.soft]}>
        {link && !rotate.isPending ? (
          <View style={styles.qrBox}>
            <QRCode
              value={link}
              size={QR_SIZE}
              ecl="H"
              backgroundColor={AddyColors.white}
              color={AddyColors.ink}
            />
            {profile ? (
              <View style={styles.qrAvatar}>
                <UserAvatar user={profile} size={48} />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={[styles.qrBox, styles.center]}>
            <ActivityIndicator color={AddyColors.ink} />
          </View>
        )}
        {profile ? <Text style={styles.username}>@{profile.username}</Text> : null}
      </View>

      <Text style={styles.caption}>
        Scanning this adds you as friends right away.
      </Text>
      <GlossyButton
        label="🔗 Share my link"
        disabled={!link}
        onPress={() => shareInviteLink(link)}
        style={styles.stretch}
      />
      <Pressable
        onPress={confirmReset}
        disabled={rotate.isPending || !link}
        accessibilityRole="button"
        hitSlop={6}
        style={styles.linkButton}
      >
        <Text style={styles.resetText}>↻ Reset my code and link</Text>
      </Pressable>
    </View>
  );
}

function Scanner({
  visible,
  active,
  onScanned,
}: {
  /** The Scan side is showing; the camera prompt waits for this. */
  visible: boolean;
  active: boolean;
  onScanned: (token: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);
  const [reading, setReading] = useState(false);

  // Ask only once the Scan side is open.
  useEffect(() => {
    if (visible && permission && !permission.granted && permission.canAskAgain) {
      void requestPermission();
    }
  }, [visible, permission, requestPermission]);

  const accept = (raw: string): boolean => {
    if (handled.current) return true;
    const token = parseInviteToken(raw);
    if (!token) return false;
    handled.current = true;
    onScanned(token);
    return true;
  };

  const scanPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (result.canceled || !result.assets[0]) return;
    setReading(true);
    try {
      const codes = await scanFromURLAsync(result.assets[0].uri, ["qr"]);
      if (!codes.some((code) => accept(code.data))) {
        showToast("No Addy code in that photo");
      }
    } catch {
      showToast("Couldn't read that photo");
    } finally {
      setReading(false);
    }
  };

  let viewfinder: React.ReactNode;
  if (!permission) {
    viewfinder = <ActivityIndicator color={AddyColors.white} />;
  } else if (!permission.granted) {
    viewfinder = (
      <View style={styles.denied}>
        <Text style={styles.deniedText}>
          Addy needs the camera to scan a friend&apos;s code.
        </Text>
        <GlossyButton
          label={permission.canAskAgain ? "Allow camera" : "Open Settings"}
          onPress={() =>
            permission.canAskAgain
              ? void requestPermission()
              : void Linking.openSettings()
          }
        />
      </View>
    );
  } else {
    viewfinder = (
      <>
        {active ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={({ data }) => {
              accept(data);
            }}
          />
        ) : null}
        <ScanOverlay />
      </>
    );
  }

  return (
    <View style={styles.side}>
      <View style={styles.scanner}>{viewfinder}</View>
      <Text style={styles.caption}>
        Scans by itself, no button to press. Their profile opens as soon as the
        code is read.
      </Text>
      <Pressable
        onPress={() => void scanPhoto()}
        disabled={reading}
        accessibilityRole="button"
        hitSlop={6}
        style={styles.linkButton}
      >
        {reading ? (
          <ActivityIndicator color={AddyColors.ink} />
        ) : (
          <Text style={styles.photoText}>🖼️ Scan from a photo</Text>
        )}
      </Pressable>
    </View>
  );
}

/** Lime corner brackets, a sweeping scan line and the hint. */
function ScanOverlay() {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0.5);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
    return () => cancelAnimation(progress);
  }, [progress, reduceMotion]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: 40 + progress.value * (SCANNER_SIZE - 110) }],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />
      <Animated.View style={[styles.scanLine, lineStyle]} />
      <Text style={styles.scanHint}>point at a friend&apos;s Addy code</Text>
    </View>
  );
}

const CORNER = 34;
const CORNER_WIDTH = 4;

const styles = StyleSheet.create({
  background: { backgroundColor: AddyColors.paper },
  handleIndicator: { backgroundColor: AddyColors.line, width: 40 },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 18 },
  side: { alignItems: "center", gap: 14 },
  center: { alignItems: "center", justifyContent: "center" },
  hiddenPane: { position: "absolute", top: 0, left: 0, right: 0, opacity: 0 },
  stretch: { alignSelf: "stretch" },
  qrCard: {
    alignItems: "center",
    gap: 12,
    padding: 22,
    borderRadius: 26,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  qrBox: {
    width: QR_SIZE,
    height: QR_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  qrAvatar: {
    position: "absolute",
    padding: 4,
    borderRadius: 30,
    backgroundColor: AddyColors.white,
  },
  username: {
    fontFamily: AddyFonts.title,
    fontSize: 20,
    lineHeight: 26,
    color: AddyColors.ink,
  },
  caption: {
    fontFamily: AddyFonts.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    color: AddyColors.inkMuted,
  },
  linkButton: { minHeight: 44, justifyContent: "center" },
  resetText: { fontFamily: AddyFonts.body, fontSize: 15, color: AddyColors.inkMuted },
  photoText: { fontFamily: AddyFonts.bodyMedium, fontSize: 15, color: "#2A9AD6" },
  scanner: {
    width: SCANNER_SIZE,
    height: SCANNER_SIZE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 26,
    backgroundColor: AddyColors.captureBg,
  },
  denied: { alignItems: "center", gap: 14, padding: 24 },
  deniedText: {
    fontFamily: AddyFonts.body,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    color: AddyColors.white,
  },
  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: AddyColors.lime,
  },
  topLeft: {
    top: 16,
    left: 16,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: 16,
    right: 16,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: 16,
    left: 16,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: 16,
    right: 16,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: 10,
  },
  scanLine: {
    position: "absolute",
    top: 0,
    left: 28,
    right: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: AddyColors.lime,
    boxShadow: `0 0 10px ${AddyColors.lime}`,
  },
  scanHint: {
    position: "absolute",
    bottom: 22,
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: AddyFonts.tech,
    fontSize: 18,
    color: AddyColors.white,
  },
});
