import { Fragment } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { GlossyButton } from "@/components/ui/glossy-button";
import { ToggleRow } from "@/components/ui/toggle-row";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
  BrandColors,
} from "@/constants/theme";
import { SettingsSectionTitle } from "@/features/profile/components/settings-row";
import { useNotificationPermission } from "@/features/profile/use-notification-permission";
import {
  useNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} from "@/services/notifications";
import type { NotificationPreferences } from "@/services/notifications";

type SwitchKey = {
  [K in keyof NotificationPreferences]: NotificationPreferences[K] extends boolean
    ? K
    : never;
}[keyof NotificationPreferences];

type Row = { key: SwitchKey; label: string; description: string };

const FROM_FRIENDS: Row[] = [
  // One switch for both server prefs: friendRequests and friendAccepted.
  { key: "friendRequests", label: "Friend requests", description: "requests and accepts" },
  { key: "tags", label: "Tags", description: "when someone tags you" },
  // Only the memory's owner hears about messages on it.
  { key: "messages", label: "Messages", description: "Messages in your memories" },
  { key: "likes", label: "Likes", description: "can get noisy" },
];

/** Settings rows that write more than one preference. */
const LINKED: Partial<Record<SwitchKey, SwitchKey[]>> = {
  friendRequests: ["friendRequests", "friendAccepted"],
};

const FROM_ADDY: Row[] = [
  {
    key: "friendsNearby",
    label: "Friends nearby",
    description: "a friend pinned near you · in app",
  },
];

/**
 * Notification preferences and a banner when device notifications are off.
 */
export function NotificationSettingsSection() {
  const { data: prefs, isLoading, isError, refetch } =
    useNotificationPreferencesQuery();
  const update = useUpdateNotificationPreferencesMutation();
  const permission = useNotificationPermission();

  const setSwitch = (key: SwitchKey, value: boolean) => {
    const keys = LINKED[key] ?? [key];
    update.mutate(Object.fromEntries(keys.map((k) => [k, value])));
  };

  // A linked row reads as on while any of its prefs is on.
  const switchValue = (key: SwitchKey) =>
    prefs ? (LINKED[key] ?? [key]).some((k) => prefs[k]) : false;

  const renderCard = (rows: Row[]) => (
    <View style={[styles.card, AddyShadow.soft]}>
      {rows.map((row, index) => (
        <Fragment key={row.key}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <ToggleRow
            label={row.label}
            description={row.description}
            value={switchValue(row.key)}
            onValueChange={(next) => setSwitch(row.key, next)}
          />
        </Fragment>
      ))}
    </View>
  );

  return (
    <View style={styles.section}>
      {permission.ready && !permission.granted ? (
        <View style={styles.banner}>
          <View style={styles.bannerText}>
            <Text style={styles.bannerTitle}>Notifications are off for Addy</Text>
            <Text style={styles.bannerNote}>
              You&apos;ll still see them in the 🔔 list
            </Text>
          </View>
          <GlossyButton
            label="Turn on"
            style={styles.turnOn}
            onPress={() => void permission.turnOn()}
          />
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={AddyColors.ink} />
        </View>
      ) : isError || !prefs ? (
        <View style={styles.center}>
          <Text style={styles.note}>Could not load your preferences.</Text>
          <Pressable onPress={() => refetch()} hitSlop={8}>
            <Text style={styles.retry}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <SettingsSectionTitle>From friends</SettingsSectionTitle>
          {renderCard(FROM_FRIENDS)}
          <SettingsSectionTitle>From Addy</SettingsSectionTitle>
          {renderCard(FROM_ADDY)}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: AddyRadius.card,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: "#EBCB5A",
    backgroundColor: "#FFF2BF",
  },
  bannerText: { flex: 1, gap: 2 },
  turnOn: { minHeight: 42, paddingHorizontal: 18 },
  bannerTitle: {
    fontFamily: AddyFonts.title,
    fontSize: 17,
    lineHeight: 23,
    color: AddyColors.ink,
  },
  bannerNote: {
    fontFamily: AddyFonts.tech,
    fontSize: 16,
    lineHeight: 18,
    color: "#7A5A00",
  },
  card: {
    paddingHorizontal: 18,
    paddingVertical: 4,
    borderRadius: AddyRadius.card,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: AddyColors.line },
  center: { alignItems: "center", gap: 8, paddingVertical: 32 },
  note: { fontFamily: AddyFonts.body, fontSize: 14, color: AddyColors.inkMuted },
  retry: { fontFamily: AddyFonts.title, fontSize: 15, color: BrandColors.link },
});
