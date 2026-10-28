import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { ApiClientError } from "@/services/api/errors";
import type { MemoryDetail } from "@/services/memories";
import { queryKeys } from "@/services/query/keys";
import type { Paginated } from "@/types/api";
import { messageApi } from "./messages.api";
import type { MemoryMessage } from "./messages.type";

type MessagePages = InfiniteData<Paginated<MemoryMessage>, unknown>;

export function isNotFoundError(error: unknown) {
  return error instanceof ApiClientError && error.status === 404;
}

/** Thread pages: `pages[0]` is the newest page, later pages are older. */
export function useMemoryMessagesQuery(memoryId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.memoryMessages(memoryId),
    queryFn: ({ pageParam }) => messageApi.listMessages(memoryId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    // A 404 means the thread is gone for this viewer (private, unfriended,
    // blocked) — retrying won't change that.
    retry: (count, error) => !isNotFoundError(error) && count < 1,
    enabled,
  });
}

/** Friends the viewer can tag on this memory — fetched once, filtered locally. */
export function useMentionableQuery(memoryId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.memoryMentionable(memoryId),
    queryFn: () => messageApi.listMentionable(memoryId),
    staleTime: 60_000,
    retry: (count, error) => !isNotFoundError(error) && count < 1,
    enabled,
  });
}

/** Oldest→newest across every loaded page. */
export function flattenMessagePages(data: MessagePages | undefined) {
  if (!data) return [];
  return [...data.pages].reverse().flatMap((page) => page.items);
}

function updateMessagePages(
  queryClient: QueryClient,
  memoryId: string,
  update: (items: MemoryMessage[], pageIndex: number) => MemoryMessage[],
) {
  queryClient.setQueryData<MessagePages>(
    queryKeys.memoryMessages(memoryId),
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page, i) => ({
          ...page,
          items: update(page.items, i),
        })),
      },
  );
}

function patchMessageInPages(
  queryClient: QueryClient,
  memoryId: string,
  messageId: string,
  patch: Partial<MemoryMessage>,
) {
  updateMessagePages(queryClient, memoryId, (items) =>
    items.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
  );
}

function bumpMessageCount(
  queryClient: QueryClient,
  memoryId: string,
  delta: number,
) {
  queryClient.setQueryData<MemoryDetail>(
    queryKeys.memory(memoryId),
    (memory) =>
      memory && {
        ...memory,
        messageCount: Math.max(0, memory.messageCount + delta),
      },
  );
}

/**
 * Add a message to the newest page unless it's already there: the REST
 * response and the socket's `comment:created` can land in either order.
 * Returns whether it was added.
 */
export function appendMessage(
  queryClient: QueryClient,
  memoryId: string,
  message: MemoryMessage,
): boolean {
  const key = queryKeys.memoryMessages(memoryId);
  const data = queryClient.getQueryData<MessagePages>(key);
  if (!data) {
    queryClient.invalidateQueries({ queryKey: key });
    return false;
  }
  if (flattenMessagePages(data).some((m) => m.id === message.id)) return false;
  updateMessagePages(queryClient, memoryId, (items, i) =>
    i === 0 ? [...items, message] : items,
  );
  bumpMessageCount(queryClient, memoryId, 1);
  return true;
}

/** Remove a message; returns whether it was loaded. */
export function removeMessage(
  queryClient: QueryClient,
  memoryId: string,
  messageId: string,
): boolean {
  const data = queryClient.getQueryData<MessagePages>(
    queryKeys.memoryMessages(memoryId),
  );
  if (!flattenMessagePages(data).some((m) => m.id === messageId)) return false;
  updateMessagePages(queryClient, memoryId, (items) =>
    items.filter((m) => m.id !== messageId),
  );
  bumpMessageCount(queryClient, memoryId, -1);
  return true;
}

/** Replace a message, unless what's cached is already newer. */
export function replaceMessageIfNewer(
  queryClient: QueryClient,
  memoryId: string,
  message: MemoryMessage,
) {
  updateMessagePages(queryClient, memoryId, (items) =>
    items.map((m) =>
      m.id === message.id && !isOlder(message.updatedAt, m.updatedAt)
        ? message
        : m,
    ),
  );
}

/** Patch one message's like count, leaving the viewer's own ♥ alone. */
export function setMessageLikeCount(
  queryClient: QueryClient,
  memoryId: string,
  messageId: string,
  count: number,
) {
  patchMessageInPages(queryClient, memoryId, messageId, { likeCount: count });
}

/** `incoming` is older than `current` (missing stamps never count as older). */
export function isOlder(incoming?: string, current?: string): boolean {
  if (!incoming || !current) return false;
  return new Date(incoming).getTime() < new Date(current).getTime();
}

export function usePostMessageMutation(memoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ text, clientTempId }: { text: string; clientTempId?: string }) =>
      messageApi.postMessage(memoryId, text, clientTempId),
    onSuccess: (message) => {
      appendMessage(queryClient, memoryId, message);
    },
  });
}

export function useLikeMessageMutation(memoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, like }: { id: string; like: boolean }) =>
      like ? messageApi.likeMessage(id) : messageApi.unlikeMessage(id),
    onMutate: async ({ id, like }) => {
      const key = queryKeys.memoryMessages(memoryId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = flattenMessagePages(
        queryClient.getQueryData<MessagePages>(key),
      ).find((m) => m.id === id);
      if (previous && previous.likedByMe !== like) {
        patchMessageInPages(queryClient, memoryId, id, {
          likedByMe: like,
          likeCount: Math.max(0, previous.likeCount + (like ? 1 : -1)),
        });
      }
      return { previous };
    },
    onError: (_error, { id }, context) => {
      if (context?.previous) {
        const { likeCount, likedByMe } = context.previous;
        patchMessageInPages(queryClient, memoryId, id, {
          likeCount,
          likedByMe,
        });
      }
    },
    onSuccess: (result, { id }) => {
      patchMessageInPages(queryClient, memoryId, id, result);
    },
  });
}

export function useEditMessageMutation(memoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      messageApi.editMessage(id, text),
    onSuccess: (message) => {
      patchMessageInPages(queryClient, memoryId, message.id, message);
    },
  });
}

export function useDeleteMessageMutation(memoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await messageApi.deleteMessage(id);
      } catch (error) {
        // Already gone server-side — the bubble should disappear either way.
        if (!isNotFoundError(error)) throw error;
      }
    },
    onMutate: async (id) => {
      const key = queryKeys.memoryMessages(memoryId);
      await queryClient.cancelQueries({ queryKey: key });
      const previousPages = queryClient.getQueryData<MessagePages>(key);
      const previousMemory = queryClient.getQueryData<MemoryDetail>(
        queryKeys.memory(memoryId),
      );
      updateMessagePages(queryClient, memoryId, (items) =>
        items.filter((m) => m.id !== id),
      );
      bumpMessageCount(queryClient, memoryId, -1);
      return { previousPages, previousMemory };
    },
    onError: (_error, _id, context) => {
      if (context?.previousPages) {
        queryClient.setQueryData(
          queryKeys.memoryMessages(memoryId),
          context.previousPages,
        );
      }
      if (context?.previousMemory) {
        queryClient.setQueryData(
          queryKeys.memory(memoryId),
          context.previousMemory,
        );
      }
    },
  });
}
