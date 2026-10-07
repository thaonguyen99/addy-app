import {
  type InfiniteData,
  type QueryClient,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { ApiClientError } from "@/lib/api/errors";
import * as messagesApi from "@/lib/api/messages";
import { queryKeys } from "@/lib/query/keys";
import type { MemoryDetail, MemoryMessage, Paginated } from "@/types/api";

type MessagePages = InfiniteData<Paginated<MemoryMessage>, unknown>;

export function isNotFoundError(error: unknown) {
  return error instanceof ApiClientError && error.status === 404;
}

/** Thread pages: `pages[0]` is the newest page, later pages are older. */
export function useMemoryMessagesQuery(memoryId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.memoryMessages(memoryId),
    queryFn: ({ pageParam }) => messagesApi.listMessages(memoryId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    // A 404 means the thread is gone for this viewer (private, unfriended,
    // blocked) — retrying won't change that.
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

export function usePostMessageMutation(memoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => messagesApi.postMessage(memoryId, text),
    onSuccess: (message) => {
      const key = queryKeys.memoryMessages(memoryId);
      if (queryClient.getQueryData<MessagePages>(key)) {
        updateMessagePages(queryClient, memoryId, (items, i) =>
          i === 0 ? [...items, message] : items,
        );
      } else {
        queryClient.invalidateQueries({ queryKey: key });
      }
      bumpMessageCount(queryClient, memoryId, 1);
    },
  });
}

export function useLikeMessageMutation(memoryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, like }: { id: string; like: boolean }) =>
      like ? messagesApi.likeMessage(id) : messagesApi.unlikeMessage(id),
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
      messagesApi.editMessage(id, text),
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
        await messagesApi.deleteMessage(id);
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
