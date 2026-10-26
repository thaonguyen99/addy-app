import { useLocalSearchParams } from "expo-router";

import { ProfileScreen } from "@/features/profile/components/profile-screen";

export default function UserProfileRoute() {
  const { username } = useLocalSearchParams<{ username?: string }>();
  return <ProfileScreen username={typeof username === "string" ? username : ""} />;
}
