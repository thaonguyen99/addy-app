import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BrandColors } from "@/constants/theme";
import { safeBack } from "@/lib/navigation/safe-router";

type ProfileSubHeaderProps = Readonly<{
  title: string;
}>;

/** Shared back+title header for the Account/Security/Notifications sub-screens. */
export function ProfileSubHeader({ title }: ProfileSubHeaderProps) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => safeBack("/(app)/profile")}
        hitSlop={12}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Back to profile menu"
      >
        <Ionicons name="chevron-back" size={22} color={BrandColors.ink} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  title: {
    fontFamily: "Fredoka-SemiBold",
    fontSize: 19,
    color: BrandColors.ink,
  },
});
