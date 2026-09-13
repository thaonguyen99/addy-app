import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TourTarget } from "@wrack/react-native-tour-guide";

import { StickerCard } from "@/components/ui/sticker-card";
import { StickerRadius } from "@/constants/sticker-style";
import { BrandColors } from "@/constants/theme";
import { MoodSticker } from "@/features/feed/components/mood-sticker";
import { ONBOARDING_MEMORY_DETAIL_TARGET_ID } from "@/features/onboarding/onboarding-tour";
import { ReactorsSheet } from "@/features/reactions/components/reactors-sheet";
import type { ReactorsSheetRef } from "@/features/reactions/components/reactors-sheet";
import { safeBack } from "@/lib/navigation/safe-router";
import {
  useMemoryQuery,
  useProfileQuery,
  useToggleReactionMutation,
  useUpdateMemoryMutation,
} from "@/lib/query/hooks";
import type { MemoryImage } from "@/types/api";

const SCREEN_WIDTH = Dimensions.get("window").width;
const HERO_PADDING = 20;
const HERO_WIDTH = SCREEN_WIDTH - HERO_PADDING * 2;
const HERO_HEIGHT = 340;

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
  const toggleReaction = useToggleReactionMutation(id);
  const reactorsSheet = useRef<ReactorsSheetRef>(null);

  const displayName = data?.isOwner
    ? (profile?.name ?? profile?.email ?? "You")
    : (data?.author.name ?? data?.author.username ?? "Friend");
  const initials = displayName.charAt(0).toUpperCase();

  const formattedDate = data
    ? new Date(data.capturedAt).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const openVisibilityMenu = () => {
    if (!data) return;
    const isFriends = data.visibility === "friends";
    Alert.alert(
      "Memory visibility",
      `Currently: ${isFriends ? "Visible to friends" : "Private"}`,
      [
        {
          text: "Private",
          onPress: () => updateMemory.mutate({ visibility: "private" }),
        },
        {
          text: "Visible to friends",
          onPress: () => updateMemory.mutate({ visibility: "friends" }),
        },
        { text: "Cancel", style: "cancel" },
      ],
    );
  };

  const liked = data ? (data.isOwner ? data.reactionCount > 0 : data.hasReacted) : false;

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
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => safeBack("/(app)/(tabs)")}
              hitSlop={12}
              style={styles.circleButton}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons name="chevron-back" size={22} color={BrandColors.ink} />
            </Pressable>
            <View style={styles.headerRight}>
              {data.isOwner ? (
                <Pressable
                  onPress={openVisibilityMenu}
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
              ) : null}
              <View style={styles.circleButton}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>
          </View>

          {/* Photo strip — sticker-carded, mood badge tilted on the corner,
              matching the "memory reveal" moodboard reference. */}
          <View style={styles.heroSection}>
            <TourTarget id={ONBOARDING_MEMORY_DETAIL_TARGET_ID}>
              <StickerCard radius={StickerRadius.card} style={styles.heroCard}>
                <ImageCarousel images={data.images} />
              </StickerCard>
            </TourTarget>
            <View style={styles.heroSticker}>
              <MoodSticker score={data.moodScore} size={42} />
            </View>
          </View>

          <View style={styles.content}>
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

            <StickerCard borderStyle="dashed" shadowOffset={2}>
              <View style={styles.placeCard}>
                <MaterialIcons name="place" size={18} color={BrandColors.primary} />
                <Text style={styles.address}>{data.place.formattedAddress}</Text>
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

            <View style={styles.reactionRow}>
              {!data.isOwner ? (
                <Pressable
                  onPress={() => {
                    void Haptics.impactAsync(
                      Haptics.ImpactFeedbackStyle.Light,
                    );
                    toggleReaction.mutate();
                  }}
                  hitSlop={10}
                  style={styles.reactionButton}
                  accessibilityRole="button"
                  accessibilityLabel={
                    data.hasReacted ? "Remove reaction" : "React to this memory"
                  }
                >
                  <Ionicons
                    name={liked ? "heart" : "heart-outline"}
                    size={22}
                    color={liked ? BrandColors.accentPink : BrandColors.inkMuted}
                  />
                </Pressable>
              ) : (
                <View style={styles.reactionButton}>
                  <Ionicons
                    name={liked ? "heart" : "heart-outline"}
                    size={22}
                    color={liked ? BrandColors.accentPink : BrandColors.inkMuted}
                  />
                </View>
              )}
              {data.reactionCount > 0 ? (
                <Pressable
                  onPress={() => reactorsSheet.current?.present()}
                  hitSlop={8}
                >
                  <Text style={styles.reactionCount}>
                    {data.reactionCount}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </ScrollView>
      )}
      <ReactorsSheet ref={reactorsSheet} memoryId={id} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.paper },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorEmoji: { fontSize: 40 },
  errorText: {
    fontSize: 16,
    color: BrandColors.inkMuted,
    fontWeight: "500",
  },

  scroll: { paddingBottom: 40 },

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
  },
  avatarText: {
    color: BrandColors.ink,
    fontSize: 14,
    fontWeight: "700",
  },

  heroSection: {
    position: "relative",
    paddingHorizontal: HERO_PADDING,
  },
  heroCard: {
    alignSelf: "center",
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
    top: -12,
    right: HERO_PADDING + 8,
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
    textAlign: "center",
  },

  tagRow: {
    alignItems: "center",
  },
  tagSticker: {
    transform: [{ rotate: "-2deg" }],
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

  reactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reactionButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  reactionCount: {
    fontSize: 15,
    color: BrandColors.ink,
    fontWeight: "700",
  },
});
