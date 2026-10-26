import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlossyButton } from "@/components/ui/glossy-button";
import { IconCircleButton } from "@/components/ui/icon-circle-button";
import { SkyBackground } from "@/components/ui/sky-background";
import { AddyFonts } from "@/constants/theme";
import {
  BottomLeftCobweb,
  TopRightCobweb,
} from "@/features/profile/components/cobwebs";
import {
  ProfileIdentity,
  ProfileMuted,
  ProfileTopRow,
} from "@/features/profile/components/profile-header";
import { ProfileStatsCard } from "@/features/profile/components/profile-stats-card";
import { PROFILE_SIDE_PADDING } from "@/features/profile/grid-layout";

/**
 * Blocked you, deleted, or never existed: one identical screen for all three
 * so nothing here tells them apart.
 */
export function ProfileNotFound({ onBack }: { onBack: () => void }) {
  return (
    <SkyBackground tone="grey">
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <TopRightCobweb style={styles.topWeb} />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <ProfileTopRow
            muted
            title="@unknown"
            left={
              <IconCircleButton
                icon="chevron-back"
                size={36}
                accessibilityLabel="Go back"
                onPress={onBack}
              />
            }
          />
          <View style={styles.header}>
            <ProfileIdentity
              muted
              user={null}
              name="Addy user"
              below={<Text style={styles.subtle}>User not found</Text>}
            />
            <ProfileStatsCard muted stats={null} />
          </View>

          <View style={styles.message}>
            <Text style={styles.title}>Nothing to see here</Text>
            <Text style={styles.subtle}>This account isn&apos;t available.</Text>
            <GlossyButton
              label="‹ Go back"
              variant="ghost"
              onPress={onBack}
              style={styles.back}
            />
          </View>

          {/* In the flow, not on top: the web can never cover the button. */}
          <View style={styles.bottom}>
            <BottomLeftCobweb />
          </View>
        </ScrollView>
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topWeb: { position: "absolute", top: 0, right: 0 },
  content: { flexGrow: 1, paddingHorizontal: PROFILE_SIDE_PADDING },
  header: { gap: 16, marginTop: 4 },
  message: { alignItems: "center", gap: 2, marginTop: 32 },
  title: {
    fontFamily: AddyFonts.title,
    fontSize: 24,
    lineHeight: 32,
    color: ProfileMuted.text,
  },
  subtle: {
    fontFamily: AddyFonts.body,
    fontSize: 14,
    color: ProfileMuted.subtle,
  },
  back: { marginTop: 16, minWidth: 160 },
  bottom: {
    flex: 1,
    minHeight: 110,
    justifyContent: "flex-end",
    marginLeft: -PROFILE_SIDE_PADDING,
  },
});
