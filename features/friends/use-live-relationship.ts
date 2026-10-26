import { useMemo } from "react";

import {
  type FriendRelationship,
  useFriendRequestsQuery,
  useFriendsQuery,
} from "@/services/friends";

/**
 * Where you stand with someone right now, from the request and friend lists
 * (search results and suggestions go stale as soon as you tap a button).
 * `requestId` is what Accept / Cancel act on.
 */
export function useLiveRelationship(
  userId: string,
  fallback: FriendRelationship | undefined,
): { relationship: FriendRelationship; requestId?: string; ready: boolean } {
  const incoming = useFriendRequestsQuery("incoming");
  const outgoing = useFriendRequestsQuery("outgoing");
  const friends = useFriendsQuery();

  return useMemo(() => {
    const ready = !incoming.isLoading && !outgoing.isLoading && !friends.isLoading;
    const received = incoming.data?.pages
      .flatMap((p) => p.items)
      .find((r) => r.user.id === userId);
    if (received) return { relationship: "request_received", requestId: received.id, ready };
    const sent = outgoing.data?.pages
      .flatMap((p) => p.items)
      .find((r) => r.user.id === userId);
    if (sent) return { relationship: "request_sent", requestId: sent.id, ready };
    const isFriend = friends.data?.pages
      .flatMap((p) => p.items)
      .some((f) => f.user.id === userId);
    // The friends list is paged, so trust an opener that already knew.
    if (isFriend || fallback === "friend") return { relationship: "friend", ready };
    return { relationship: "none", ready };
  }, [incoming.data, outgoing.data, friends.data, incoming.isLoading, outgoing.isLoading, friends.isLoading, userId, fallback]);
}
