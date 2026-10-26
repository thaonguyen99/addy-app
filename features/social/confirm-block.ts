import { Alert } from "react-native";

export function confirmBlock(name: string, onBlock: () => void): void {
  Alert.alert(
    `Block ${name}?`,
    "They won't be able to send you requests or see your memories. Any friendship is removed.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Block", style: "destructive", onPress: onBlock },
    ],
  );
}

export function confirmUnblock(name: string, onUnblock: () => void): void {
  Alert.alert(
    `Unblock ${name}?`,
    "They'll be able to find you and send a friend request again. This does not restore a previous friendship.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Unblock", onPress: onUnblock },
    ],
  );
}
