import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";

import type { MemoryDetail } from "@/services/memories";
import {
  appendMessage,
  isOlder,
  type MemoryMessage,
  removeMessage,
  replaceMessageIfNewer,
  setMessageLikeCount,
} from "@/services/messages";
import { queryKeys } from "@/services/query/keys";
import { realtime } from "@/services/realtime/socket";
import { useActiveMemoryStore } from "@/stores/active-memory.store";
import { useAuthStore } from "@/stores/auth.store";

type MemoryRealtimeOptions = {
  /** Someone else's message arrived (not our own echo). */
  onIncomingMessage?: (message: MemoryMessage) => void;
  /** Our own send came back on the socket before REST answered. */
  onOwnMessageEchoed?: (clientTempId: string) => void;
};

/**
 * Keeps an open memory chat live: joins the memory's room while the screen is
 * focused and merges its events straight into the query cache, with no refetch.
 * `unavailable` flips when the memory is deleted, made private, or you lost
 * access.
 */
export function useMemoryRealtime(
  memoryId: string,
  options: MemoryRealtimeOptions = {},
): { unavailable: boolean } {
  const queryClient = useQueryClient();
  const [unavailable, setUnavailable] = useState(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useFocusEffect(
    useCallback(() => {
      if (!memoryId) return;
      useActiveMemoryStore.setState({ memoryId });
      realtime.joinMemory(memoryId, (ack) => {
        if (!ack.ok && ack.error === "NOT_FOUND") setUnavailable(true);
      });
      return () => {
        realtime.leaveMemory(memoryId);
        if (useActiveMemoryStore.getState().memoryId === memoryId) {
          useActiveMemoryStore.setState({ memoryId: null });
        }
      };
    }, [memoryId]),
  );

  useEffect(() => {
    if (!memoryId) return;
    const ours = (payload: { memoryId?: string; id?: string }) =>
      payload.memoryId === memoryId;
    const detailKey = queryKeys.memory(memoryId);

    const offs = [
      realtime.on("comment:created", ({ memoryId: _m, clientTempId, ...message }) => {
        if (_m !== memoryId) return;
        const added = appendMessage(queryClient, memoryId, message);
        const mine = message.author?.id === useAuthStore.getState().user?.id;
        if (mine && clientTempId) {
          optionsRef.current.onOwnMessageEchoed?.(clientTempId);
        } else if (added && !mine) {
          optionsRef.current.onIncomingMessage?.(message);
        }
      }),
      realtime.on("comment:updated", ({ memoryId: _m, ...message }) => {
        if (_m !== memoryId) return;
        replaceMessageIfNewer(queryClient, memoryId, message);
      }),
      realtime.on("comment:deleted", (payload) => {
        if (!ours(payload)) return;
        removeMessage(queryClient, memoryId, payload.id);
      }),
      // Counts only: the viewer's own ♥ state stays as it is.
      realtime.on("comment:likeCount", ({ id, count }) => {
        setMessageLikeCount(queryClient, memoryId, id, count);
      }),
      realtime.on("memory:likeCount", ({ id, count }) => {
        if (id !== memoryId) return;
        queryClient.setQueryData<MemoryDetail>(
          detailKey,
          (memory) => memory && { ...memory, reactionCount: count },
        );
      }),
      realtime.on("memory:updated", (memory) => {
        if (memory.id !== memoryId) return;
        queryClient.setQueryData<MemoryDetail>(detailKey, (current) =>
          current && isOlder(memory.updatedAt, current.updatedAt)
            ? current
            : memory,
        );
      }),
      realtime.on("memory:unavailable", ({ id }) => {
        if (id === memoryId) setUnavailable(true);
      }),
    ];
    return () => offs.forEach((off) => off());
  }, [memoryId, queryClient]);

  return { unavailable };
}
