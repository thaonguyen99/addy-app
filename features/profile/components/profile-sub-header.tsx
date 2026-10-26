import { StyleSheet, Text, View } from "react-native";

import { IconCircleButton } from "@/components/ui/icon-circle-button";
import { AddyColors, AddyFonts } from "@/constants/theme";
import { safeBack } from "@/lib/safe-router";

type ProfileSubHeaderProps = Readonly<{
  title: string;
  /** Where Back goes when there's no history. Defaults to Settings. */
  fallback?: Parameters<typeof safeBack>[0];
}>;

const BACK_SIZE = 40;

/** Back + centered title header for Settings and its sub-screens. */
export function ProfileSubHeader({
  title,
  fallback = "/(app)/profile",
}: ProfileSubHeaderProps) {
  return (
    <View style={styles.row}>
      <IconCircleButton
        icon="chevron-back"
        size={BACK_SIZE}
        accessibilityLabel="Back"
        onPress={() => safeBack(fallback)}
      />
      <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </Text>
      {/* Balances the back button so the title stays centered. */}
      <View style={styles.spacer} />
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
    flex: 1,
    textAlign: "center",
    fontFamily: AddyFonts.title,
    fontSize: 26,
    lineHeight: 36,
    color: AddyColors.ink,
  },
  spacer: { width: BACK_SIZE },
});
