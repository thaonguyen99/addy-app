import { Alert } from "react-native";

/**
 * Asks whether to go ahead with photos the on-device check flagged. The
 * model has false positives (close-ups of skin, dim photos), so a flag is a
 * warning the user can override, not a block; reports remain the backstop.
 * Resolves `true` for "Post anyway", `false` for "Choose another" or a
 * dismissed dialog.
 */
export function confirmFlaggedPhotos(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: "Choose another", style: "cancel", onPress: () => resolve(false) },
        { text: "Post anyway", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}
