import * as Crypto from "expo-crypto";
import { useCallback, useMemo, useState } from "react";

import type { ThreadItem } from "@/features/memory/message-bubble";
import { ApiClientError } from "@/services/api/errors";
import type { MemoryMessage } from "@/services/messages";
import {
  flattenMessagePages,
  isNotFoundError,
  useLikeMessageMutation,
  useMemoryMessagesQuery,
  usePostMessageMutation,
} from "@/services/messages";
import { showToast } from "@/stores/toast.store";

type PendingItem = Extract<ThreadItem, { kind: "pending" }>;

/**
 * The chat thread for one memory: server pages plus local sends that are
 * still in flight or failed (kept out of the query cache so a refetch can't
 * wipe a failed bubble before the user retries it).
 */
export function useMessageThread(memoryId: string, enabled: boolean) {
  const query = useMemoryMessagesQuery(memoryId, enabled);
  const postMessage = usePostMessageMutation(memoryId);
  const likeMessage = useLikeMessageMutation(memoryId);
  const [pending, setPending] = useState<PendingItem[]>([]);

  const items = useMemo<ThreadItem[]>(
    () => [
      ...flattenMessagePages(query.data).map(
        (message): ThreadItem => ({ kind: "message", message }),
      ),
      ...pending,
    ],
    [query.data, pending],
  );

  const deliver = useCallback(
    async (clientId: string, text: string) => {
      try {
        await postMessage.mutateAsync({ text, clientTempId: clientId });
        setPending((list) => list.filter((p) => p.clientId !== clientId));
      } catch (error) {
        setPending((list) =>
          list.map((p) =>
            p.clientId === clientId ? { ...p, status: "failed" } : p,
          ),
        );
        // The limiter answers 429 with code BAD_REQUEST, so check the status.
        if (error instanceof ApiClientError && error.status === 429) {
          showToast("Whoa, slow down — try again in a minute.");
        }
      }
    },
    [postMessage],
  );

  const send = useCallback(
    (text: string) => {
      const clientId = Crypto.randomUUID();
      setPending((list) => [
        ...list,
        {
          kind: "pending",
          clientId,
          text,
          createdAt: new Date().toISOString(),
          status: "sending",
        },
      ]);
      void deliver(clientId, text);
    },
    [deliver],
  );

  const retry = useCallback(
    (clientId: string) => {
      const item = pending.find((p) => p.clientId === clientId);
      if (!item || item.status !== "failed") return;
      setPending((list) =>
        list.map((p) =>
          p.clientId === clientId ? { ...p, status: "sending" } : p,
        ),
      );
      void deliver(clientId, item.text);
    },
    [pending, deliver],
  );

  /** The socket delivered our own send before REST answered. */
  const resolvePending = useCallback((clientId: string) => {
    setPending((list) => list.filter((p) => p.clientId !== clientId));
  }, []);

  const toggleLike = useCallback(
    (message: MemoryMessage) => {
      likeMessage.mutate({ id: message.id, like: !message.likedByMe });
    },
    [likeMessage],
  );

  return {
    items,
    isLoading: query.isLoading,
    isUnavailable: isNotFoundError(query.error),
    isError: query.isError && !isNotFoundError(query.error),
    refetch: query.refetch,
    hasOlder: Boolean(query.hasNextPage),
    isLoadingOlder: query.isFetchingNextPage,
    loadOlder: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        void query.fetchNextPage();
      }
    },
    isSending: pending.some((p) => p.status === "sending"),
    send,
    retry,
    resolvePending,
    toggleLike,
  };
}
