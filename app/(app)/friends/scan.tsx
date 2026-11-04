import { Redirect } from "expo-router";
import { useEffect } from "react";

import { useFriendSheetsStore } from "@/stores/friend-sheets.store";

/** Old Scan screen: opens the QR sheet on its Scan side over the Friends screen. */
export default function ScanRoute() {
  useEffect(() => {
    useFriendSheetsStore.getState().openQr("scan");
  }, []);
  return <Redirect href="/(app)/friends" />;
}
