import { StyleSheet, Text, View } from "react-native";

import { AddyColors, AddyFonts } from "@/constants/theme";
import { useNotificationCountsQuery } from "@/services/notifications";

/** "9+" above nine; nothing at zero. */
export function badgeLabel(count: number): string | null {
  if (count <= 0) return null;
  return count > 9 ? "9+" : String(count);
}

/** 🔔 for the Notifications tab, with the pink count badge. */
export function NotificationBell() {
  const { data } = useNotificationCountsQuery();
  const label = badgeLabel(data?.badge ?? 0);

  return (
    <View>
      <Text style={styles.bell}>🔔</Text>
      {label ? (
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bell: { fontSize: 20 },
  badge: {
    position: "absolute",
    top: -6,
    right: -10,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: AddyColors.white,
    backgroundColor: AddyColors.pink,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: AddyColors.white,
    fontFamily: AddyFonts.bodyBold,
    fontSize: 10,
    lineHeight: 13,
  },
});
