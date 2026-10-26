import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SkyBackground } from "@/components/ui/sky-background";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";
import { ChangePasswordSection } from "@/features/profile/components/change-password-section";
import { ProfileSubHeader } from "@/features/profile/components/profile-sub-header";
import { useProfileQuery } from "@/services/users";

export function SecurityScreen() {
  const { data: profile, isLoading } = useProfileQuery();

  return (
    <SkyBackground>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ProfileSubHeader title="Sign-in & security" />
        {isLoading || !profile ? (
          <View style={styles.center}>
            <ActivityIndicator color={AddyColors.ink} size="large" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Sign-in info, not identity: only you see it. */}
            <View style={[styles.card, AddyShadow.soft]}>
              <Text style={styles.cardLabel}>signed in as</Text>
              <Text style={styles.email} numberOfLines={1}>
                {profile.email}
              </Text>
            </View>
            <ChangePasswordSection hasPassword={profile.hasPassword} />
          </ScrollView>
        )}
      </SafeAreaView>
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
    gap: 20,
  },
  card: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: AddyRadius.card,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.paper,
  },
  cardLabel: {
    fontFamily: AddyFonts.tech,
    fontSize: 16,
    color: AddyColors.inkMuted,
  },
  email: {
    fontFamily: AddyFonts.bodySemiBold,
    fontSize: 16,
    color: AddyColors.ink,
  },
});
