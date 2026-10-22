import type { Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { IconCircleButton } from "@/components/ui/icon-circle-button";
import { AddyColors, AddyFonts } from "@/constants/theme";
import { safeBack } from "@/lib/navigation/safe-router";

export function ScreenHeader({
  title,
  fallback = "/(app)/(tabs)",
  right,
  showBack = true,
}: {
  title: string;
  fallback?: Href;
  right?: React.ReactNode;
  /** False for tab roots, which have nothing to go back to. */
  showBack?: boolean;
}) {
  return (
    <View style={styles.bar}>
      {showBack ? (
        <IconCircleButton
          icon="chevron-back"
          accessibilityLabel="Back"
          onPress={() => safeBack(fallback)}
        />
      ) : null}
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    flex: 1,
    fontFamily: AddyFonts.title,
    fontSize: 20,
    lineHeight: 30,
    color: AddyColors.ink,
  },
});
