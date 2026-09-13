import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import { NotificationSettingsSection } from "@/features/profile/components/notification-settings-section";
import { ProfileSubHeader } from "@/features/profile/components/profile-sub-header";

export function NotificationsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ProfileSubHeader title="Notifications" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <NotificationSettingsSection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.paper },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 40,
  },
});
