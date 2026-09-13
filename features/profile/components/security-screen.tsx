import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import { ChangePasswordSection } from "@/features/profile/components/change-password-section";
import { ProfileSubHeader } from "@/features/profile/components/profile-sub-header";
import { useProfileQuery } from "@/lib/query/hooks";

export function SecurityScreen() {
  const { data: profile, isLoading } = useProfileQuery();

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ProfileSubHeader title="Security" />
      {isLoading || !profile ? (
        <View style={styles.center}>
          <ActivityIndicator color={BrandColors.primary} size="large" />
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
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.paper },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 40,
  },
});
