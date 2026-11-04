import { Redirect } from "expo-router";

/** Old Find friends screen: search now lives on the Friends screen. */
export default function AddFriendsRoute() {
  return <Redirect href="/(app)/friends" />;
}
