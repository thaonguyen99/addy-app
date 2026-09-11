import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import { safeBack } from "@/lib/navigation/safe-router";

export function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => safeBack("/(app)/profile")}
          hitSlop={12}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color={BrandColors.primary} />
          <Text style={styles.backLabel}>Profile</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Privacy Policy for Addy</Text>
        <Text style={styles.effectiveDate}>Effective Date: September 11, 2026</Text>

        <Text style={styles.paragraph}>
          Addy ("we," "us," or "our") respects your privacy. This Privacy
          Policy explains what information we collect, how we use it, and
          your choices.
        </Text>

        <Text style={styles.heading}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          {"• "}Account information: email address, username, display
          name, bio, and profile photo (all except email are optional).
          {"\n\n"}
          {"• "}Content you create: photos you capture or upload, any
          caption/feeling you add, the date/time captured, the place (name,
          address, coordinates) you tag it to, and your chosen visibility
          (private or friends-only).
          {"\n\n"}
          {"• "}Location data: with your permission, we use your
          device's precise or approximate location to tag memories to real
          places and to center the map. We do not track your location in the
          background.
          {"\n\n"}
          {"• "}Social data: your friends list, sent/received friend
          requests, and any accounts you block.
          {"\n\n"}
          {"• "}Device data: a push-notification token and platform
          (iOS/Android) so we can deliver notifications you've enabled (e.g.,
          friend requests, reactions).
          {"\n\n"}
          {"• "}Authentication data: your password is stored in
          encrypted (hashed) form and never stored or transmitted in plain
          text; if you sign in with Google, we receive your Google account
          identifier instead of a password.
        </Text>

        <Text style={styles.heading}>2. How We Use Your Information</Text>
        <Text style={styles.paragraph}>
          We use your information to operate Addy's core features: showing
          your memories on a map, sharing memories with friends you choose,
          sending notifications you've enabled, and keeping your account
          secure. We do not sell your personal information and do not use it
          for third-party advertising.
        </Text>

        <Text style={styles.heading}>3. Third-Party Services</Text>
        <Text style={styles.paragraph}>
          We use the following service providers to operate Addy: Cloudinary
          (stores and serves your uploaded photos), Goong Maps (map tiles,
          place search, and location lookups), Google Sign-In (optional
          sign-in method), Expo (delivers push notifications), and Railway
          (hosts our backend servers and database). Each provider only
          receives the data necessary to perform its function.
        </Text>

        <Text style={styles.heading}>4. Data Retention &amp; Deletion</Text>
        <Text style={styles.paragraph}>
          We retain your information for as long as your account is active.
          You can delete individual memories at any time in the app. You can
          permanently delete your account and all associated data — profile,
          memories, photos, friend connections, and notification tokens — at
          any time from Profile → Delete account. This action is immediate
          and cannot be undone. You may also request deletion by emailing
          nhthau99@gmail.com.
        </Text>

        <Text style={styles.heading}>5. Children's Privacy</Text>
        <Text style={styles.paragraph}>
          Addy is not directed to children under 13, and we do not knowingly
          collect information from children under 13.
        </Text>

        <Text style={styles.heading}>6. Changes to This Policy</Text>
        <Text style={styles.paragraph}>
          We may update this policy from time to time. We'll update the
          effective date above when we do.
        </Text>

        <Text style={styles.heading}>7. Contact Us</Text>
        <Text style={styles.paragraph}>
          Questions about this policy or your data? Email
          nhthau99@gmail.com.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BrandColors.gray900,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  backLabel: {
    color: BrandColors.primary,
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    color: BrandColors.neutral,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 8,
  },
  effectiveDate: {
    color: BrandColors.neutralMuted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  heading: {
    color: BrandColors.neutral,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    color: BrandColors.neutralMuted,
    fontSize: 14,
    lineHeight: 21,
  },
});
