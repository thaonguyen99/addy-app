import { AddFriendSheet } from "@/features/friends/components/add-friend-sheet";
import { FriendMenuSheet } from "@/features/friends/components/friend-menu-sheet";
import { FriendsCelebrationSheet } from "@/features/friends/components/friends-celebration-sheet";
import { QrSheet } from "@/features/friends/components/qr-sheet";

/** Friend sheets that open over any screen in the signed-in app. */
export function FriendSheetsHost() {
  return (
    <>
      <QrSheet />
      <AddFriendSheet />
      <FriendsCelebrationSheet />
      <FriendMenuSheet />
    </>
  );
}
