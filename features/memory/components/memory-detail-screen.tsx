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

import { BrandColors } from "@/constants/theme";
import { ToggleRow } from "@/components/ui/toggle-row";
import { MOOD_SCORE_OPTIONS } from "@/features/camera/constants/mood-score";
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
const HERO_HEIGHT = 300;

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
      >
        {sorted.map((img) => (
          <Image
            key={img.publicId}
            source={{ uri: img.url }}
            style={styles.hero}
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

  const moodOption =
    data?.moodScore != null
      ? MOOD_SCORE_OPTIONS.find((o) => o.score === data.moodScore)
      : null;

  const displayName = profile?.name ?? profile?.email ?? "You";
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
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => safeBack("/(app)/(tabs)")}
          hitSlop={12}
          style={styles.backButton}
        >
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>
      </View>

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
          <ImageCarousel images={data.images} />

          <View style={styles.content}>
            {/* Username row */}
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text style={styles.username}>{displayName}</Text>
            </View>

            {/* Place name + address */}
            <View style={styles.placeSection}>
              <View style={styles.pinkAccent} />
              <View style={styles.placeInfo}>
                <Text style={styles.placeName}>{data.place.name}</Text>
                <Text style={styles.address}>
                  📍 {data.place.formattedAddress}
                </Text>
              </View>
            </View>

            {/* Mood score */}
            {moodOption ? (
              <View style={styles.moodCard}>
                <Text style={styles.moodLabel}>Mood</Text>
                <View style={styles.moodPill}>
                  <Text style={styles.moodEmoji}>{moodOption.emoji}</Text>
                  <Text style={styles.moodScoreLabel}>{moodOption.label}</Text>
                </View>
              </View>
            ) : null}

            {/* Feeling / note */}
            {data.feeling ? (
              <View style={styles.feelingCard}>
                <View style={styles.feelingAccent} />
                <Text style={styles.feelingText}>"{data.feeling}"</Text>
              </View>
            ) : null}

            {/* Date */}
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>🗓</Text>
              <Text style={styles.metaText}>{formattedDate}</Text>
            </View>

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

  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: BrandColors.gray900,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.neutralBorder,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  backArrow: {
    fontSize: 18,
    color: BrandColors.primary,
    fontWeight: "600",
  },
  backLabel: {
    fontSize: 16,
    color: BrandColors.primary,
    fontWeight: "600",
  },

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorEmoji: { fontSize: 40 },
  errorText: {
    fontSize: 16,
    color: BrandColors.neutralMuted,
    fontWeight: "500",
  },

  scroll: { paddingBottom: 40 },

  hero: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: BrandColors.neutralBorder,
  },
  heroPlaceholder: {
    width: "100%",
    height: HERO_HEIGHT,
    backgroundColor: BrandColors.primaryMuted,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  heroPlaceholderText: { fontSize: 48 },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    paddingBottom: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BrandColors.neutralBorder,
  },
  dotActive: {
    width: 18,
    backgroundColor: BrandColors.primary,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 18,
  },

  // Username
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
    backgroundColor: BrandColors.elevated,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BrandColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: BrandColors.neutral,
    fontSize: 13,
    fontWeight: "700",
  },
  username: {
    fontSize: 14,
    fontWeight: "600",
    color: BrandColors.neutral,
  },

  // Place
  placeSection: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  pinkAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: BrandColors.primary,
    alignSelf: "stretch",
    minHeight: 40,
  },
  placeInfo: {
    flex: 1,
    gap: 4,
  },
  placeName: {
    fontSize: 22,
    fontWeight: "700",
    color: BrandColors.neutral,
    lineHeight: 28,
  },
  address: {
    fontSize: 13,
    color: BrandColors.neutralMuted,
    lineHeight: 19,
    flexWrap: "wrap",
  },

  // Mood
  moodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: BrandColors.elevated,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  moodLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: BrandColors.neutralMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  moodPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BrandColors.primaryMuted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  moodEmoji: { fontSize: 18 },
  moodScoreLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: BrandColors.neutral,
  },

  // Feeling
  feelingCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: BrandColors.elevated,
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  feelingAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: BrandColors.primary,
    alignSelf: "stretch",
  },
  feelingText: {
    flex: 1,
    fontSize: 15,
    fontStyle: "italic",
    color: BrandColors.neutralMuted,
    lineHeight: 22,
  },

  // Meta
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaIcon: { fontSize: 14 },
  metaText: {
    fontSize: 13,
    color: BrandColors.neutralMuted,
  },
  reactionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 4,
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
