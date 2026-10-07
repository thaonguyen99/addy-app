import Ionicons from "@expo/vector-icons/Ionicons";
import { TourTarget } from "@wrack/react-native-tour-guide";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { StickerCard } from "@/components/ui/sticker-card";
import { StickerShadowBox } from "@/components/ui/sticker-shadow";
import { StickerBorderWidth, StickerRadius } from "@/constants/sticker-style";
import { BrandColors } from "@/constants/theme";
import { MoodSticker } from "@/features/feed/components/mood-sticker";
import { formatCapturedAtLabel } from "@/features/feed/utils/format-relative-time";
import { useAuthStore } from "@/features/auth/store/auth-store";
import {
  MessageBubble,
  type ThreadItem,
} from "@/features/memory/components/message-bubble";
import type { MessageActionsSheetRef } from "@/features/memory/components/message-actions-sheet";
import { MessageActionsSheet } from "@/features/memory/components/message-actions-sheet";
import { MessageComposer } from "@/features/memory/components/message-composer";
import { MessageThreadHeader } from "@/features/memory/components/message-thread-header";
import { useMessageThread } from "@/features/memory/hooks/use-message-thread";
import type { MemoryOptionsSheetRef } from "@/features/memory/components/memory-options-sheet";
import { MemoryOptionsSheet } from "@/features/memory/components/memory-options-sheet";
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
  useProfileQuery,
  useToggleReactionMutation,
  useUpdateMemoryMutation,
} from "@/lib/query/hooks";
import type { MemoryImage, MemoryMessage, MemoryVisibility } from "@/types/api";

const SCREEN_WIDTH = Dimensions.get("window").width;
const HERO_PADDING = 20;
const STRIP_INSET = 10;
const HERO_WIDTH = SCREEN_WIDTH - HERO_PADDING * 2 - STRIP_INSET * 2;
const HERO_HEIGHT = 300;
/** Start loading older messages when scrolling up within this many px of the thread top. */
const LOAD_OLDER_THRESHOLD = 160;

type MemoryDetailScreenProps = {
  id: string;
};

function ImageCarousel({ images }: { images: MemoryImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const sorted = [...images].sort((a, b) => {
    if (a.type === "cover") return -1;
    if (b.type === "cover") return 1;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / HERO_WIDTH);
    setActiveIndex(idx);
  };

  if (sorted.length === 0) {
    return (
      <View style={styles.heroPlaceholder}>
        <Text style={styles.heroPlaceholderText}>📷</Text>
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        style={styles.heroScroll}
      >
        {sorted.map((img) => (
          <Image
            key={img.publicId}
            source={{ uri: img.url }}
            style={styles.heroPhoto}
            contentFit="cover"
          />
        ))}
      </ScrollView>

      {sorted.length > 1 ? (
        <View style={styles.dotsRow}>
          {sorted.map((img, i) => (
            <View
              key={img.publicId}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function MemoryDetailScreen({ id }: MemoryDetailScreenProps) {
  const { data, isLoading, isError } = useMemoryQuery(id);
  const { data: profile } = useProfileQuery();
  const updateMemory = useUpdateMemoryMutation(id);
  const deleteMemory = useDeleteMemoryMutation(id);
  const toggleReaction = useToggleReactionMutation(id);
  const reactorsSheet = useRef<ReactorsSheetRef>(null);
  const optionsSheet = useRef<MemoryOptionsSheetRef>(null);
  const reportSheet = useRef<ReportSheetRef>(null);
  const listRef = useRef<FlatList<ThreadItem>>(null);
  const viewerId = useAuthStore((s) => s.user?.id);

  // Private memories have no thread at all — don't even fetch it.
  const showThread = data !== undefined && data.visibility !== "private";
  const thread = useMessageThread(id, showThread);
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const editMessage = useEditMessageMutation(id);
  const deleteMessage = useDeleteMessageMutation(id);
  const messageActions = useRef<MessageActionsSheetRef>(null);

  // Thread top in list coordinates = height of the list header (hero + label).
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

  const renderThreadItem = useCallback(
    ({ item }: { item: ThreadItem }) => (
      <MessageBubble
        item={item}
        viewerId={viewerId}
        viewerIsMemoryOwner={data?.isOwner ?? false}
        onToggleLike={thread.toggleLike}
        onRetry={thread.retry}
        onLongPress={onMessageLongPress}
      />
    ),
    [
      viewerId,
      data?.isOwner,
      thread.toggleLike,
      thread.retry,
      onMessageLongPress,
    ],
  );

  const displayName = data?.isOwner
    ? (profile?.name ?? profile?.email ?? "You")
    : (data?.author.name ?? data?.author.username ?? "Friend");
  const initials = displayName.charAt(0).toUpperCase();

  const openOptionsMenu = () => {
    optionsSheet.current?.present();
  };

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

  // hasReacted always reflects the viewer's own reaction, owner included —
  // now that owners can react to their own memory too, that's the only
  // thing "liked" should mean (reactionCount alone would stay true after
  // the owner un-likes their own post if a friend had also reacted).
  const liked = data?.hasReacted ?? false;

  const bubbleLabel = data
    ? `${data.isOwner ? "you" : displayName} · ${formatCapturedAtLabel(data.capturedAt)}`
    : "";

  const onToggleLike = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleReaction.mutate();
  };

  const onViewReactors = () => {
    if (!data || data.reactionCount === 0) return;
    reactorsSheet.current?.present();
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={BrandColors.primary} size="large" />
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
                <View style={styles.headerRow}>
                  <Pressable
                    onPress={() => safeBack("/(app)/(tabs)")}
                    hitSlop={12}
                    style={styles.circleButton}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                  >
                    <Ionicons
                      name="chevron-back"
                      size={22}
                      color={BrandColors.ink}
                    />
                  </Pressable>
                  <View style={styles.headerRight}>
                    <Pressable
                      onPress={openOptionsMenu}
                      hitSlop={12}
                      style={styles.circleButton}
                      accessibilityRole="button"
                      accessibilityLabel="Memory options"
                    >
                      <Ionicons
                        name="ellipsis-horizontal"
                        size={20}
                        color={BrandColors.ink}
                      />
                    </Pressable>
                    {data?.author?.avatarUrl ? (
                      <View style={styles.circleButton}>
                        <Image
                          source={{ uri: data.author.avatarUrl }}
                          style={styles.photo}
                          contentFit="cover"
                          transition={150}
                        />
                      </View>
                    ) : (
                      <View style={styles.circleButton}>
                        <Text style={styles.avatarText}>{initials}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Chat-bubble reveal — matches the "memory reveal" moodboard
              reference: an incoming-message bubble, then a single photo
              strip card (photo inset, caption + place tag inside it,
              mood sticker hanging off its top-right corner). */}
                <View style={styles.heroSection}>
                  <View style={styles.chatBubble}>
                    <Text style={styles.chatBubbleText}>{bubbleLabel} ~~</Text>
                  </View>

                  <View style={styles.stripWrap}>
                    <TourTarget id={ONBOARDING_MEMORY_DETAIL_TARGET_ID}>
                      {/* Explicit size at every layer — a horizontal ScrollView
                    nested in a hug-content StickerCard mismeasures its
                    height, so this bypasses StickerCard's own composition
                    and fixes the box size up front instead of hugging it. */}
                      <StickerShadowBox
                        radius={StickerRadius.card}
                        style={styles.stripShadow}
                      >
                        <View style={styles.stripBorder}>
                          <View style={styles.photoInset}>
                            <ImageCarousel images={data.images} />
                          </View>

                          {data.feeling ? (
                            <Text style={styles.capLine}>{data.feeling}</Text>
                          ) : null}

                          <View style={styles.tagRow}>
                            <StickerCard
                              radius={StickerRadius.chip}
                              backgroundColor={BrandColors.accentCyan}
                              shadowOffset={2}
                              style={styles.tagSticker}
                            >
                              <Text style={styles.tagText} numberOfLines={1}>
                                📍 {data.place.name}
                              </Text>
                            </StickerCard>
                          </View>
                        </View>
                      </StickerShadowBox>
                    </TourTarget>
                    <View style={styles.heroSticker}>
                      <MoodSticker score={data.moodScore} size={42} />
                    </View>
                    <View style={styles.heartStickerWrap}>
                      <StickerCard radius={StickerRadius.pill} shadowOffset={2}>
                        <View style={styles.heartStickerInner}>
                          <Pressable
                            onPress={onToggleLike}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel={
                              liked ? "Remove reaction" : "React to this memory"
                            }
                          >
                            <Ionicons
                              name={liked ? "heart" : "heart-outline"}
                              size={16}
                              color={BrandColors.accentPink}
                            />
                          </Pressable>
                          <Pressable
                            onPress={onViewReactors}
                            hitSlop={8}
                            disabled={data.reactionCount === 0}
                            accessibilityRole="button"
                            accessibilityLabel={
                              data.reactionCount > 0
                                ? "See who reacted"
                                : undefined
                            }
                          >
                            <Text style={styles.heartStickerCount}>
                              {data.reactionCount}
                            </Text>
                          </Pressable>
                        </View>
                      </StickerCard>
                    </View>
                  </View>
                </View>

                {/* <View style={styles.content}>
            <StickerCard borderStyle="dashed" shadowOffset={2}>
              <View style={styles.placeCard}>
                <MaterialIcons
                  name="place"
                  size={18}
                  color={BrandColors.primary}
                />
                <Text style={styles.address}>
                  {data.place.formattedAddress}
                </Text>
              </View>
              <View style={styles.placeCardDivider} />
              <View style={styles.placeCard}>
                <MaterialIcons
                  name="calendar-today"
                  size={16}
                  color={BrandColors.inkMuted}
                />
                <Text style={styles.metaText}>{formattedDate}</Text>
              </View>
            </StickerCard>
          </View> */}
                {showThread ? (
                  <MessageThreadHeader
                    messageCount={data.messageCount ?? 0}
                    isLoading={thread.isLoading}
                    isError={thread.isError}
                    isUnavailable={thread.isUnavailable}
                    isEmpty={thread.items.length === 0}
                    hasOlder={thread.hasOlder}
                    isLoadingOlder={thread.isLoadingOlder}
                    onLoadOlder={thread.loadOlder}
                    onRetry={() => void thread.refetch()}
                  />
                ) : null}
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
            />
          ) : null}
        </KeyboardAvoidingView>
      )}
      <ReactorsSheet ref={reactorsSheet} memoryId={id} />
      <MemoryOptionsSheet
        ref={optionsSheet}
        isOwner={data?.isOwner ?? false}
        visibility={data?.visibility || "private"}
        onChangeVisibility={onChangeVisibility}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.paper },
  flex: { flex: 1 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorEmoji: { fontSize: 40 },
  errorText: {
    fontSize: 16,
    color: BrandColors.inkMuted,
    fontWeight: "500",
  },

  scroll: { paddingBottom: 16 },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(22, 23, 26, 0.08)",
    borderWidth: 2,
    borderColor: BrandColors.ink,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarText: {
    color: BrandColors.ink,
    fontSize: 14,
    fontWeight: "700",
  },

  heroSection: {
    paddingHorizontal: HERO_PADDING,
    gap: 10,
  },
  chatBubble: {
    alignSelf: "flex-end",
    maxWidth: "80%",
    marginRight: 8,
    backgroundColor: BrandColors.primaryLight,
    borderWidth: StickerBorderWidth.thin,
    borderColor: BrandColors.ink,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chatBubbleText: {
    fontFamily: "Fredoka-SemiBold",
    fontSize: 13,
    color: BrandColors.ink,
  },
  stripWrap: {
    position: "relative",
  },
  stripShadow: {
    alignSelf: "center",
  },
  stripBorder: {
    width: HERO_WIDTH + STRIP_INSET * 2,
    borderWidth: StickerBorderWidth.standard,
    borderColor: BrandColors.ink,
    borderRadius: StickerRadius.card,
    overflow: "hidden",
    backgroundColor: BrandColors.paper,
    padding: STRIP_INSET,
    gap: 10,
  },
  photoInset: {
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: BrandColors.gray200,
  },
  heroScroll: {
    height: HERO_HEIGHT,
    width: HERO_WIDTH,
  },
  heroPhoto: {
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    backgroundColor: BrandColors.gray200,
  },
  heroPlaceholder: {
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BrandColors.primaryMuted,
  },
  heroPlaceholderText: { fontSize: 48 },
  heroSticker: {
    position: "absolute",
    top: -14,
    right: -10,
  },
  heartStickerWrap: {
    position: "absolute",
    top: -14,
    left: -10,
  },
  heartStickerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heartStickerCount: {
    fontFamily: "Fredoka-SemiBold",
    fontSize: 13,
    color: BrandColors.ink,
  },

  dotsRow: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  dotActive: {
    width: 18,
    backgroundColor: BrandColors.white,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 14,
  },

  capLine: {
    fontFamily: "VT323-Regular",
    fontSize: 20,
    color: BrandColors.ink,
    // textAlign: "center",
  },

  tagRow: {
    alignItems: "flex-start",
  },
  tagSticker: {
    transform: [{ rotate: "-1.5deg" }],
  },
  tagText: {
    fontFamily: "VT323-Regular",
    fontSize: 16,
    color: BrandColors.ink,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },

  placeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
  },
  placeCardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: BrandColors.stroke2,
    marginHorizontal: 14,
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: BrandColors.ink,
    lineHeight: 20,
  },
  metaText: {
    fontSize: 13,
    color: BrandColors.inkMuted,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
});
