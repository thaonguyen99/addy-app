import { Redirect } from "expo-router";

/** Old Invite screen: the invite card or strip on the Friends tab. */
export default function InviteRoute() {
  return <Redirect href="/(app)/(tabs)/friends?tab=invite" />;
}
