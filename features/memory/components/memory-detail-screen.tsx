import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
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

import { BrandColors } from "@/constants/theme";
import { ToggleRow } from "@/components/ui/toggle-row";
import { MoodSticker } from "@/features/feed/components/mood-sticker";
import { POLAROID } from "@/features/feed/utils/polaroid";
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
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
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

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
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
          {/* Hero photo with floating header controls on top */}
          <View style={styles.heroSection}>
            <ImageCarousel images={data.images} />

            <SafeAreaView
              style={styles.heroHeader}
              edges={["top"]}
              pointerEvents="box-none"
            >
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
                  color={BrandColors.white}
                />
              </Pressable>
              <View style={styles.circleButton}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </SafeAreaView>

            <View style={styles.heroSticker}>
              <MoodSticker score={data.moodScore} />
            </View>
          </View>

          <View style={styles.content}>
            {/* Feeling / note — a paper note with a paperclip */}
            {data.feeling ? (
              <View style={styles.noteCard}>
                <Text style={styles.paperclip}>📎</Text>
                <Text style={styles.noteText}>"{data.feeling}"</Text>
              </View>
            ) : null}

            {/* Place name + address + date */}
            <TourTarget id={ONBOARDING_MEMORY_DETAIL_TARGET_ID}>
              <View style={styles.placeCard}>
                <Text style={styles.placeName}>{data.place.name}</Text>
                <Text style={styles.address}>
                  📍 {data.place.formattedAddress}
                </Text>
                <Text style={styles.metaText}>🗓 {formattedDate}</Text>
              </View>
            </TourTarget>

            {/* Reactions */}
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
                    name={data.hasReacted ? "heart" : "heart-outline"}
                    size={24}
                    color={
                      data.hasReacted
                        ? BrandColors.primary
                        : BrandColors.neutralMuted
                    }
                  />
                </Pressable>
              ) : (
                <Ionicons
                  name="heart"
                  size={22}
                  color={BrandColors.neutralMuted}
                />
              )}
              <Pressable
                onPress={() => {
                  if (data.reactionCount > 0) reactorsSheet.current?.present();
                }}
                hitSlop={8}
              >
                <Text style={styles.reactionCount}>
                  {data.reactionCount === 0
                    ? "No reactions yet"
                    : `${data.reactionCount} ${
                        data.reactionCount === 1 ? "reaction" : "reactions"
                      }`}
                </Text>
              </Pressable>
            </View>

            {/* Owner: visibility control */}
            {data.isOwner ? (
              <View style={styles.visibilityCard}>
                <ToggleRow
                  label="Visible to friends"
                  description="Friends can see this memory on their map."
                  value={data.visibility === "friends"}
                  disabled={updateMemory.isPending}
                  onValueChange={(next) =>
                    updateMemory.mutate({
                      visibility: next ? "friends" : "private",
                    })
                  }
                />
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}
      <ReactorsSheet ref={reactorsSheet} memoryId={id} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.gray900 },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorEmoji: { fontSize: 40 },
  errorText: {
    fontSize: 16,
    color: BrandColors.neutralMuted,
    fontWeight: "500",
  },

  scroll: { paddingBottom: 40 },

  // Hero
  heroSection: {
    position: "relative",
  },
  heroHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(43, 28, 33, 0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: BrandColors.white,
    fontSize: 14,
    fontWeight: "700",
  },
  heroScroll: {
    height: HERO_HEIGHT,
  },
  heroPhoto: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: BrandColors.gray200,
  },
  heroPlaceholder: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BrandColors.primaryMuted,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroPlaceholderText: { fontSize: 48 },
  heroSticker: {
    position: "absolute",
    bottom: 12,
    right: 16,
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
    paddingTop: 20,
    gap: 18,
  },

  // Feeling — paper note with a paperclip
  noteCard: {
    backgroundColor: BrandColors.paper,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    ...POLAROID.shadow,
  },
  paperclip: {
    position: "absolute",
    top: -14,
    left: 16,
    fontSize: 26,
    transform: [{ rotate: "-12deg" }],
  },
  noteText: {
    fontFamily: "PatrickHand-Regular",
    fontSize: 19,
    lineHeight: 24,
    color: BrandColors.ink,
  },

  // Place + date
  placeCard: {
    backgroundColor: BrandColors.elevated,
    borderRadius: 14,
    padding: 16,
    gap: 6,
  },
  placeName: {
    fontSize: 20,
    fontWeight: "700",
    color: BrandColors.neutral,
    lineHeight: 26,
  },
  address: {
    fontSize: 13,
    color: BrandColors.neutralMuted,
    lineHeight: 19,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: 13,
    color: BrandColors.neutralMuted,
    marginTop: 4,
  },

  reactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  reactionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BrandColors.elevated,
  },
  reactionCount: {
    fontSize: 14,
    color: BrandColors.neutralMuted,
    fontWeight: "600",
  },
  visibilityCard: {
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.neutralBorder,
    backgroundColor: BrandColors.elevated,
  },
});
