import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";

type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * In-screen confirmation sheet. Rendered inside the screen (not a portal) so
 * it also works on top of native modal screens, where @gorhom sheets don't.
 */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(150)}
        style={[StyleSheet.absoluteFill, styles.backdrop]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
        />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.duration(220)}
        exiting={SlideOutDown.duration(180)}
        style={[
          styles.card,
          AddyShadow.raised,
          { paddingBottom: Math.max(20, insets.bottom + 8) },
        ]}
      >
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        {message ? <Text style={styles.message}>{message}</Text> : null}
        <Pressable
          onPress={onConfirm}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            destructive ? styles.buttonDanger : styles.buttonPrimary,
            pressed && styles.pressed,
          ]}
        >
          <Text
            style={[styles.buttonLabel, destructive && styles.buttonLabelDanger]}
          >
            {confirmLabel}
          </Text>
        </Pressable>
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          style={({ pressed }) => [styles.button, styles.buttonGhost, pressed && styles.pressed]}
        >
          <Text style={styles.buttonLabel}>{cancelLabel}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(22, 23, 26, 0.4)" },
  card: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    gap: 10,
    paddingTop: 10,
    paddingHorizontal: 20,
    backgroundColor: AddyColors.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: AddyColors.line,
    marginBottom: 6,
  },
  title: {
    fontFamily: AddyFonts.title,
    fontSize: 20,
    lineHeight: 30,
    color: AddyColors.ink,
    textAlign: "center",
  },
  message: {
    fontFamily: AddyFonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: AddyColors.inkMuted,
    textAlign: "center",
    marginBottom: 6,
  },
  button: {
    minHeight: 50,
    borderRadius: AddyRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: ADDY_BORDER_WIDTH,
  },
  buttonPrimary: {
    backgroundColor: AddyColors.lime,
    borderColor: AddyColors.limeDeep,
  },
  buttonDanger: {
    backgroundColor: AddyColors.pink,
    borderColor: AddyColors.pink,
  },
  buttonGhost: {
    backgroundColor: AddyColors.white,
    borderColor: AddyColors.line,
  },
  buttonLabel: {
    fontFamily: AddyFonts.title,
    fontSize: 16,
    color: AddyColors.ink,
  },
  buttonLabelDanger: { color: AddyColors.white },
  pressed: { opacity: 0.8 },
});
