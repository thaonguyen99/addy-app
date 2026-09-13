import Ionicons from "@expo/vector-icons/Ionicons";
import type { Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BrandColors } from "@/constants/theme";
import { safeBack } from "@/lib/navigation/safe-router";

export function ScreenHeader({
  title,
  fallback = "/(app)/(tabs)",
  right,
}: {
  title: string;
  fallback?: Href;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={() => safeBack(fallback)}
        hitSlop={12}
        style={styles.back}
      >
        <Ionicons name="chevron-back" size={22} color={BrandColors.ink} />
        <Text style={styles.title}>{title}</Text>
      </Pressable>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BrandColors.stroke2,
  },
  back: { flexDirection: "row", alignItems: "center", gap: 4 },
  title: { fontFamily: "Fredoka-SemiBold", fontSize: 18, color: BrandColors.ink },
});
