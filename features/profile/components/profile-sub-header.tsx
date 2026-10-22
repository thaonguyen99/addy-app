import { StyleSheet, Text, View } from "react-native";

import { IconCircleButton } from "@/components/ui/icon-circle-button";
import { AddyColors, AddyFonts } from "@/constants/theme";
import { safeBack } from "@/lib/navigation/safe-router";

type ProfileSubHeaderProps = Readonly<{
  title: string;
}>;

/** Shared back+title header for the Account/Security/Notifications sub-screens. */
export function ProfileSubHeader({ title }: ProfileSubHeaderProps) {
  return (
    <View style={styles.row}>
      <IconCircleButton
        icon="chevron-back"
        accessibilityLabel="Back to profile settings"
        onPress={() => safeBack("/(app)/profile")}
      />
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontFamily: AddyFonts.title,
    fontSize: 20,
    lineHeight: 30,
    color: AddyColors.ink,
  },
});
