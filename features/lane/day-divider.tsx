import { StyleSheet, Text, View } from "react-native";

import { ADDY_BORDER_WIDTH, AddyColors, AddyFonts } from "@/constants/theme";

/** Small centered pill between days: "today", "yesterday", "4 Mar". */
export function DayDivider({ label }: { label: string }) {
  return (
    <View style={styles.row} accessibilityRole="header">
      <Text style={styles.pill}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center" },
  pill: {
    fontFamily: AddyFonts.tech,
    fontSize: 16,
    lineHeight: 18,
    color: AddyColors.inkMuted,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    overflow: "hidden",
  },
});
