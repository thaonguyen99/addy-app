import { useLocalSearchParams } from "expo-router";

import { InviteLinkRoute } from "@/features/friends/components/invite-link-route";

/** Old QR / deep link: addyapp://add-friend?token=… */
export default function AddFriendRoute() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  return <InviteLinkRoute token={typeof token === "string" ? token : undefined} />;
}
