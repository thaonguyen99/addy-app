import { Redirect } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlossyButton } from "@/components/ui/glossy-button";
import { GlossyOrb } from "@/components/ui/glossy-orb";
import { IconCircleButton } from "@/components/ui/icon-circle-button";
import { PlaceTag } from "@/components/ui/place-tag";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SkyBackground } from "@/components/ui/sky-background";
import { StickerCard } from "@/components/ui/sticker-card";
import { TechChip } from "@/components/ui/tech-chip";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  PIN_COLOR,
} from "@/constants/theme";
import { MOOD_SCORE_OPTIONS } from "@/features/camera/constants/mood-score";
import { MoodSticker } from "@/features/feed/components/mood-sticker";
import { safeBack } from "@/lib/navigation/safe-router";

/** Dev-only showcase of the revamp primitives. Open addyapp:///dev-primitives. */
export default function DevPrimitivesScreen() {
  const [visibility, setVisibility] = useState<"private" | "friends">("friends");

  if (!__DEV__) return <Redirect href="/(app)/(tabs)" />;

  return (
    <SkyBackground>
      <SafeAreaView style={styles.flex} edges={["top"]}>
        <View style={styles.header}>
          <IconCircleButton
            icon="chevron-back"
            accessibilityLabel="Back"
            onPress={() => safeBack("/(app)/(tabs)")}
          />
          <Text style={styles.title}>Primitives</Text>
          <IconCircleButton
            icon="settings-outline"
            accessibilityLabel="Settings"
            onPress={() => {}}
          />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Section label="Colors">
            <View style={styles.row}>
              {(
                ["lime", "limeDeep", "cyan", "pink", "yellow", "ink", "paper", "paperDim", "mapBg"] as const
              ).map((key) => (
                <View key={key} style={styles.swatchWrap}>
                  <View style={[styles.swatch, { backgroundColor: AddyColors[key] }]} />
                  <Text style={styles.caption}>{key}</Text>
                </View>
              ))}
            </View>
            <View style={styles.row}>
              <View style={[styles.swatch, { backgroundColor: PIN_COLOR }]} />
            </View>
          </Section>

          <Section label="Type">
            <Text style={styles.sampleTitle}>Baloo 2 · Kỷ niệm</Text>
            <Text style={styles.sampleBody}>
              Be Vietnam Pro · Quán cà phê đường Nguyễn Huệ
            </Text>
            <Text style={styles.sampleTech}>VT323 · 2h ago · 12 ♥</Text>
          </Section>

          <Section label="Orbs">
            <View style={styles.row}>
              <GlossyOrb size={62} ringWidth={4} />
              <GlossyOrb size={74} />
              <GlossyOrb size={40}>
                <Text style={styles.orbEmoji}>🥳</Text>
              </GlossyOrb>
            </View>
          </Section>

          <Section label="Buttons">
            <GlossyButton label="📍 Pin it" onPress={() => {}} />
            <GlossyButton label="💌 Invite friends" variant="secondary" onPress={() => {}} />
            <GlossyButton label="Saving" loading onPress={() => {}} />
          </Section>

          <Section label="Chips & tags">
            <View style={styles.row}>
              <TechChip label="quick snap" leading="⚡" tone="dark" />
              <TechChip label="12 memories" trailing="›" tone="dark" onPress={() => {}} />
              <TechChip label="Friends" tone="pink" onPress={() => {}} />
              <TechChip label="1×" tone="lime" size="sm" />
              <TechChip label="2h ago" size="sm" />
            </View>
            <PlaceTag name="Cộng Cà Phê · Lý Tự Trọng" />
          </Section>

          <Section label="Segmented">
            <SegmentedControl
              options={[
                { value: "private", label: "only me" },
                { value: "friends", label: "friends" },
              ]}
              value={visibility}
              onChange={setVisibility}
            />
          </Section>

          <Section label="Mood stickers">
            <View style={styles.row}>
              {MOOD_SCORE_OPTIONS.map((option) => (
                <MoodSticker
                  key={option.score}
                  score={option.score}
                  size={30}
                  seed={`demo-${option.score}`}
                />
              ))}
            </View>
          </Section>

          <Section label="Card + input">
            <StickerCard>
              <View style={styles.cardBody}>
                <Text style={styles.sampleBody}>Soft card, hairline border</Text>
                <TextInput
                  placeholder="say something sweet…"
                  placeholderTextColor={AddyColors.inkMuted}
                  style={styles.input}
                />
              </View>
            </StickerCard>
          </Section>
        </ScrollView>
      </SafeAreaView>
    </SkyBackground>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: { fontFamily: AddyFonts.title, fontSize: 22, color: AddyColors.ink },
  content: { padding: 16, gap: 22, paddingBottom: 60 },
  section: { gap: 10 },
  sectionLabel: {
    fontFamily: AddyFonts.titleSemiBold,
    fontSize: 15,
    color: AddyColors.inkMuted,
  },
  row: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 },
  swatchWrap: { alignItems: "center", gap: 2 },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
  },
  caption: { fontFamily: AddyFonts.tech, fontSize: 13, color: AddyColors.inkMuted },
  sampleTitle: { fontFamily: AddyFonts.title, fontSize: 24, color: AddyColors.ink },
  sampleBody: { fontFamily: AddyFonts.body, fontSize: 15, color: AddyColors.ink },
  sampleTech: { fontFamily: AddyFonts.tech, fontSize: 20, color: AddyColors.ink },
  orbEmoji: { fontSize: 20 },
  cardBody: { padding: 14, gap: 10 },
  input: {
    fontFamily: AddyFonts.body,
    fontSize: 15,
    color: AddyColors.ink,
    backgroundColor: AddyColors.white,
    borderRadius: AddyRadius.input,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
