import { TourTarget } from "@wrack/react-native-tour-guide";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconCircleButton } from "@/components/ui/icon-circle-button";
import { SkyBackground } from "@/components/ui/sky-background";
import { TechChip } from "@/components/ui/tech-chip";
import { ADDY_BORDER_WIDTH, AddyColors, AddyFonts } from "@/constants/theme";
import { useAuthStore } from "@/features/auth/store/auth-store";
import { formatRelativeTime } from "@/features/feed/utils/format-relative-time";
import { ChatAvatar } from "@/features/memory/components/chat-avatar";
import { MemoryPostBubble } from "@/features/memory/components/memory-post-bubble";
import type { MemoryOptionsSheetRef } from "@/features/memory/components/memory-options-sheet";
import { MemoryOptionsSheet } from "@/features/memory/components/memory-options-sheet";
import type { MessageActionsSheetRef } from "@/features/memory/components/message-actions-sheet";
import { MessageActionsSheet } from "@/features/memory/components/message-actions-sheet";
import {
  MessageBubble,
  type ThreadItem,
} from "@/features/memory/components/message-bubble";
import { MessageComposer } from "@/features/memory/components/message-composer";
import { MessageThreadHeader } from "@/features/memory/components/message-thread-header";
import { RevealFlash } from "@/features/memory/components/reveal-flash";
import { useFirstTimeHint } from "@/features/memory/hooks/use-first-time-hint";
import { useMessageThread } from "@/features/memory/hooks/use-message-thread";
import { ONBOARDING_MEMORY_DETAIL_TARGET_ID } from "@/features/onboarding/onboarding-tour";
import type { ReactorsSheetRef } from "@/features/reactions/components/reactors-sheet";
import { ReactorsSheet } from "@/features/reactions/components/reactors-sheet";
import type { ReportSheetRef } from "@/features/reports/components/report-sheet";
import { ReportSheet } from "@/features/reports/components/report-sheet";
import { showToast } from "@/features/toast/toast-store";
import { getApiErrorMessage } from "@/lib/api/errors";
import { safeBack } from "@/lib/navigation/safe-router";
import {
  useDeleteMemoryMutation,
  useDeleteMessageMutation,
  useEditMessageMutation,
  useMemoryQuery,
  useMentionableQuery,
  useToggleReactionMutation,
  useUpdateMemoryMutation,
} from "@/lib/query/hooks";
import type { MemoryMessage, MemoryVisibility } from "@/types/api";

/** Start loading older messages when scrolling up within this many px of the thread top. */
const LOAD_OLDER_THRESHOLD = 160;

/** Arrival modes for the memory chat. Open with `?reveal=on-this-day`. */
export type MemoryReveal = "on-this-day";

type MemoryDetailScreenProps = {
  id: string;
  /** Plays the arrival animation once and shows the matching pill. */
  reveal?: MemoryReveal;
};

/** "22 Oct 2025" for the on-this-day pill. */
function formatRevealDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${day} ${month} ${date.getFullYear()}`;
}

/** A memory is a chat: the post is the first message, friends reply below. */
export function MemoryDetailScreen({ id, reveal }: MemoryDetailScreenProps) {
  const { data, isLoading, isError } = useMemoryQuery(id);
  const updateMemory = useUpdateMemoryMutation(id);
  const deleteMemory = useDeleteMemoryMutation(id);
  const toggleReaction = useToggleReactionMutation(id);
  const reactorsSheet = useRef<ReactorsSheetRef>(null);
  const optionsSheet = useRef<MemoryOptionsSheetRef>(null);
  const reportSheet = useRef<ReportSheetRef>(null);
  const listRef = useRef<FlatList<ThreadItem>>(null);
  const viewerId = useAuthStore((s) => s.user?.id);
  const likeHint = useFirstTimeHint("double-tap-like");

  // Private memories have no chat at all — don't even fetch it.
  const showThread = data !== undefined && data.visibility !== "private";
  const thread = useMessageThread(id, showThread);
  const { data: mentionable } = useMentionableQuery(id, showThread);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const editMessage = useEditMessageMutation(id);
  const deleteMessage = useDeleteMessageMutation(id);
  const messageActions = useRef<MessageActionsSheetRef>(null);

  // Thread top in list coordinates = height of the list header (the post).
  const threadTopRef = useRef(0);
  const lastScrollYRef = useRef(0);

  const onListScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const scrollingUp = y < lastScrollYRef.current;
    lastScrollYRef.current = y;
    if (
      scrollingUp &&
      thread.hasOlder &&
      y < threadTopRef.current + LOAD_OLDER_THRESHOLD
    ) {
      thread.loadOlder();
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft("");
  };

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    if (editingId) {
      editMessage.mutate(
        { id: editingId, text },
        {
          onSuccess: cancelEdit,
          onError: (error) =>
            showToast(getApiErrorMessage(error, "Couldn't save your edit.")),
        },
      );
      return;
    }
    thread.send(text);
    setDraft("");
    requestAnimationFrame(() =>
      listRef.current?.scrollToEnd({ animated: true }),
    );
  };

  const onMessageLongPress = useCallback((message: MemoryMessage) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    messageActions.current?.present(message);
  }, []);

  const onEditMessage = (message: MemoryMessage) => {
    setEditingId(message.id);
    setDraft(message.text);
  };

  const onDeleteMessage = (message: MemoryMessage) => {
    if (message.id === editingId) cancelEdit();
    deleteMessage.mutate(message.id, {
      onError: (error) =>
        showToast(getApiErrorMessage(error, "Couldn't delete that message.")),
    });
  };

  // Liking anything means the double-tap hint has done its job.
  const { toggleLike: toggleMessageLike } = thread;
  const dismissLikeHint = likeHint.dismiss;
  const onToggleMessageLike = useCallback(
    (message: MemoryMessage) => {
      dismissLikeHint();
      toggleMessageLike(message);
    },
    [dismissLikeHint, toggleMessageLike],
  );

  const renderThreadItem = useCallback(
    ({ item }: { item: ThreadItem }) => (
      <MessageBubble
        item={item}
        viewerId={viewerId}
        onToggleLike={onToggleMessageLike}
        onRetry={thread.retry}
        onLongPress={onMessageLongPress}
      />
    ),
    [viewerId, onToggleMessageLike, thread.retry, onMessageLongPress],
  );

  const onChangeVisibility = (visibility: MemoryVisibility) => {
    updateMemory.mutate({ visibility });
  };

  const onDeleteMemory = () => {
    deleteMemory.mutate(undefined, {
      onSuccess: () => safeBack("/(app)/(tabs)"),
      onError: () => {
        Alert.alert("Couldn't delete memory", "Please try again.");
      },
    });
  };

  const onTogglePostLike = useCallback(() => {
    dismissLikeHint();
    toggleReaction.mutate();
  }, [dismissLikeHint, toggleReaction]);

  const onOpenReactors = useCallback(() => {
    reactorsSheet.current?.present();
  }, []);

  const onPostLongPress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    optionsSheet.current?.present();
  }, []);

  const ownerName = data ? (data.author.name ?? data.author.username) : "";

  return (
    <SkyBackground>
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <IconCircleButton
            icon="chevron-back"
            accessibilityLabel="Back"
            onPress={() => safeBack("/(app)/(tabs)")}
          />
          {data ? (
            <>
              <ChatAvatar user={data.author} size={34} />
              <View style={styles.headerText}>
                <Text style={styles.headerName} numberOfLines={1}>
                  {ownerName}
                </Text>
                <Text style={styles.headerMeta} numberOfLines={1}>
                  📍 {data.place.name}
                  <Text style={styles.headerTime}>
                    {" · "}
                    {formatRelativeTime(data.capturedAt)}
                  </Text>
                </Text>
              </View>
              <IconCircleButton
                icon="ellipsis-horizontal"
                accessibilityLabel="Memory options"
                onPress={() => optionsSheet.current?.present()}
              />
            </>
          ) : (
            <View style={styles.flex} />
          )}
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={AddyColors.ink} size="large" />
          </View>
        ) : isError || !data ? (
          <View style={styles.center}>
            <Text style={styles.errorEmoji}>😕</Text>
            <Text style={styles.errorText}>Memory not found</Text>
          </View>
        ) : (
          <KeyboardAvoidingView behavior="padding" style={styles.flex}>
            <FlatList
              ref={listRef}
              data={showThread && !thread.isUnavailable ? thread.items : []}
              keyExtractor={(item) =>
                item.kind === "message" ? item.message.id : item.clientId
              }
              renderItem={renderThreadItem}
              onScroll={onListScroll}
              scrollEventThrottle={32}
              // Keep the visible bubbles still when an older page is prepended.
              maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              contentContainerStyle={styles.scroll}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View
                  onLayout={(e) => {
                    threadTopRef.current = e.nativeEvent.layout.height;
                  }}
                >
                  {reveal === "on-this-day" ? (
                    <TechChip
                      label={`on this day · ${formatRevealDate(data.capturedAt)}`}
                      leading="✦"
                      tone="lime"
                      size="sm"
                      style={styles.revealPill}
                    />
                  ) : null}
                  {likeHint.visible ? (
                    <TechChip
                      label="double-tap a bubble to ♥"
                      size="sm"
                      style={styles.hint}
                    />
                  ) : null}
                  <TourTarget id={ONBOARDING_MEMORY_DETAIL_TARGET_ID}>
                    <MemoryPostBubble
                      memory={data}
                      reveal={reveal !== undefined}
                      onToggleLike={onTogglePostLike}
                      onOpenReactors={onOpenReactors}
                      onLongPress={onPostLongPress}
                    />
                  </TourTarget>
                  {showThread ? (
                    <MessageThreadHeader
                      isLoading={thread.isLoading}
                      isError={thread.isError}
                      isUnavailable={thread.isUnavailable}
                      isEmpty={thread.items.length === 0}
                      hasOlder={thread.hasOlder}
                      isLoadingOlder={thread.isLoadingOlder}
                      onLoadOlder={thread.loadOlder}
                      onRetry={() => void thread.refetch()}
                    />
                  ) : (
                    <TechChip
                      label="only you can see this · no chat"
                      leading="🔒"
                      size="sm"
                      style={styles.privateNote}
                    />
                  )}
                </View>
              }
            />
            {showThread && !thread.isUnavailable ? (
              <MessageComposer
                value={draft}
                onChangeText={setDraft}
                onSend={onSend}
                sending={editingId ? editMessage.isPending : thread.isSending}
                editing={editingId !== null}
                onCancelEdit={cancelEdit}
                mentionable={mentionable}
              />
            ) : null}
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
      {reveal && data ? <RevealFlash /> : null}
      <ReactorsSheet ref={reactorsSheet} memoryId={id} />
      <MemoryOptionsSheet
        ref={optionsSheet}
        isOwner={data?.isOwner ?? false}
        visibility={data?.visibility || "private"}
        onChangeVisibility={onChangeVisibility}
        onEdit={() =>
          router.push({ pathname: "/edit-memory/[id]", params: { id } })
        }
        onDelete={onDeleteMemory}
        onReport={() => reportSheet.current?.present({ type: "MEMORY", id })}
      />
      <MessageActionsSheet
        ref={messageActions}
        onEdit={onEditMessage}
        onDelete={onDeleteMessage}
        onReport={(message) =>
          reportSheet.current?.present({ type: "MESSAGE", id: message.id })
        }
      />
      <ReportSheet ref={reportSheet} />
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: ADDY_BORDER_WIDTH,
    borderBottomColor: AddyColors.line,
  },
  headerText: { flex: 1, gap: 0 },
  headerName: {
    fontFamily: AddyFonts.title,
    fontSize: 16,
    lineHeight: 22,
    color: AddyColors.ink,
  },
  // Place names can be Vietnamese, which VT323 can't render — only the
  // time uses the tech font.
  headerMeta: {
    fontFamily: AddyFonts.body,
    fontSize: 12,
    color: AddyColors.inkMuted,
  },
  headerTime: { fontFamily: AddyFonts.tech, fontSize: 15 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorEmoji: { fontSize: 40 },
  errorText: {
    fontFamily: AddyFonts.bodyMedium,
    fontSize: 16,
    color: AddyColors.inkMuted,
  },
  scroll: { paddingTop: 12, paddingBottom: 16 },
  hint: { alignSelf: "center", marginBottom: 8 },
  revealPill: { alignSelf: "center", marginBottom: 8 },
  privateNote: { alignSelf: "center", marginTop: 4 },
});
