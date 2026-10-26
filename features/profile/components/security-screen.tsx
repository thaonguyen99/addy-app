import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SkyBackground } from "@/components/ui/sky-background";
import { AddyColors } from "@/constants/theme";
import { ChangePasswordSection } from "@/features/profile/components/change-password-section";
import { ProfileSubHeader } from "@/features/profile/components/profile-sub-header";
import { useProfileQuery } from "@/services/users";

export function SecurityScreen() {
  const { data: profile, isLoading } = useProfileQuery();

  return (
    <SkyBackground>
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <ProfileSubHeader title="Security" />
        {isLoading || !profile ? (
          <View style={styles.center}>
            <ActivityIndicator color={AddyColors.ink} size="large" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
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
  },
});
