import { useLocalSearchParams } from "expo-router";

import { InviteLinkRoute } from "@/features/friends/components/invite-link-route";

/** Universal / app link: https://addy.app/i/<token> */
export default function InviteTokenRoute() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  return <InviteLinkRoute token={typeof token === "string" ? token : undefined} />;
}
