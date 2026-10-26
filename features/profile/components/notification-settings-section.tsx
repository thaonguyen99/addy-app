import { Fragment, useRef } from "react";
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
import {
  OnThisDayTimeSheet,
  type OnThisDayTimeSheetRef,
  displayTime,
} from "@/features/profile/components/on-this-day-time-sheet";
import { SettingsSectionTitle } from "@/features/profile/components/settings-row";
import { useNotificationPermission } from "@/features/profile/use-notification-permission";
import {
  deviceTimezone,
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
  { key: "friendRequests", label: "Friend requests", description: "requests and accepts" },
  { key: "tags", label: "Tags", description: "when someone tags you" },
  {
    key: "messages",
    label: "Messages",
    description: "in your memories and ones you're tagged in",
  },
  { key: "likes", label: "Likes", description: "can get noisy" },
];

const FROM_ADDY: Row[] = [
  { key: "onThisDay", label: "On this day", description: "a memory from this date" },
  {
    key: "friendsNearby",
    label: "Friends nearby",
    description: "a friend pinned near you · in app",
  },
];

/**
 * Settings › Notifications: per-type switches (likes off by default), the
 * On this day time, and a banner when the phone has notifications off.
 */
export function NotificationSettingsSection() {
  const { data: prefs, isLoading, isError, refetch } =
    useNotificationPreferencesQuery();
  const update = useUpdateNotificationPreferencesMutation();
  const permission = useNotificationPermission();
  const timeSheet = useRef<OnThisDayTimeSheetRef>(null);

  const set = (patch: Partial<NotificationPreferences>) => {
    // Turning On this day on (or moving it) is when the zone matters most.
    const timezone =
      patch.onThisDay || patch.onThisDayTime ? deviceTimezone() : undefined;
    update.mutate({ ...patch, ...(timezone ? { timezone } : {}) });
  };

  const renderCard = (rows: Row[]) => (
    <View style={[styles.card, AddyShadow.soft]}>
      {rows.map((row, index) => (
        <Fragment key={row.key}>
          {index > 0 ? <View style={styles.divider} /> : null}
          <ToggleRow
            label={row.label}
            description={row.description}
            value={prefs?.[row.key] ?? false}
            onValueChange={(next) => set({ [row.key]: next })}
            accessory={
              row.key === "onThisDay" && prefs ? (
                <Pressable
                  onPress={() => timeSheet.current?.present()}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Time: ${displayTime(prefs.onThisDayTime)}. Change`}
                  style={({ pressed }) => [styles.timeChip, pressed && styles.pressed]}
                >
                  <Text style={styles.timeChipText}>
                    {displayTime(prefs.onThisDayTime)} ›
                  </Text>
                </Pressable>
              ) : null
            }
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
              Switches below wait until you turn them on.
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
          <OnThisDayTimeSheet
            ref={timeSheet}
            value={prefs.onThisDayTime}
            onChange={(time) => set({ onThisDayTime: time })}
          />
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
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: AddyRadius.chip,
    backgroundColor: AddyColors.paperDim,
  },
  timeChipText: { fontFamily: AddyFonts.tech, fontSize: 18, color: AddyColors.ink },
  pressed: { opacity: 0.7 },
  center: { alignItems: "center", gap: 8, paddingVertical: 32 },
  note: { fontFamily: AddyFonts.body, fontSize: 14, color: AddyColors.inkMuted },
  retry: { fontFamily: AddyFonts.title, fontSize: 15, color: BrandColors.link },
});
