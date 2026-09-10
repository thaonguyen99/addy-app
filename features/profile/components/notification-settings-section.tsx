import { StyleSheet, Text, View } from "react-native";

import { BrandColors } from "@/constants/theme";
import { ToggleRow } from "@/components/ui/toggle-row";
import {
  useNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from "@/lib/query/hooks";
import type { NotificationPreferences } from "@/types/api";

const ROWS: { key: keyof NotificationPreferences; label: string }[] = [
  { key: "friendRequestReceived", label: "Friend request received" },
  { key: "friendRequestAccepted", label: "Friend request accepted" },
  { key: "reactionReceived", label: "Reactions on my memories" },
];

export function NotificationSettingsSection() {
  const { data: prefs, isLoading } = useNotificationPreferencesQuery();
  const update = useUpdateNotificationPreferencesMutation();

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Notifications</Text>
      {isLoading || !prefs ? (
        <Text style={styles.note}>Loading your preferences…</Text>
      ) : (
        ROWS.map((row) => (
          <ToggleRow
            key={row.key}
            label={row.label}
            value={prefs[row.key]}
            onValueChange={(next) => update.mutate({ [row.key]: next })}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 4,
    paddingTop: 20,
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BrandColors.stroke2,
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
    color: BrandColors.neutral,
    marginBottom: 4,
  },
  note: {
    fontSize: 14,
    color: BrandColors.neutralMuted,
  },
});
