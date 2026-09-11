import Ionicons from "@expo/vector-icons/Ionicons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useMemo, useRef, useState } from "react";
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
import { POLAROID, rotationForId } from "@/features/feed/utils/polaroid";
import { ScreenHeader } from "@/features/friends/components/screen-header";
import { ONBOARDING_MEMORY_DETAIL_TARGET_ID } from "@/features/onboarding/onboarding-tour";
import { ReactorsSheet } from "@/features/reactions/components/reactors-sheet";
import type { ReactorsSheetRef } from "@/features/reactions/components/reactors-sheet";
import {
  useMemoryQuery,
  useProfileQuery,
  useToggleReactionMutation,
  useUpdateMemoryMutation,
} from "@/lib/query/hooks";
import type { MemoryImage } from "@/types/api";

const pinImage = require("@/assets/images/pin.png");

const SCREEN_WIDTH = Dimensions.get("window").width;
const HERO_MARGIN = 20;
const HERO_PHOTO_WIDTH = SCREEN_WIDTH - HERO_MARGIN * 2 - POLAROID.borderSide * 2;
const HERO_PHOTO_HEIGHT = 320;
const HERO_PIN_SIZE = 40;

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
    const idx = Math.round(e.nativeEvent.contentOffset.x / HERO_PHOTO_WIDTH);
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

  const heroRotation = useMemo(() => rotationForId(id), [id]);

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
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScreenHeader title="Memory" fallback="/(app)/(tabs)" />

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
          {/* Hero — the memory as a pinned polaroid, same object as the map marker and feed card */}
          <View style={styles.heroSection}>
            <View
              style={[
                styles.heroTilt,
                { transform: [{ rotate: heroRotation }] },
              ]}
            >
              <Image
                source={pinImage}
                style={styles.heroPin}
                contentFit="contain"
              />
              <View style={styles.heroFrame}>
                <ImageCarousel images={data.images} />
              </View>
              <View style={styles.heroSticker}>
                <MoodSticker score={data.moodScore} />
              </View>
            </View>
          </View>

          <View style={styles.content}>
            {/* Username row */}
            <View style={styles.userRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <Text style={styles.username}>{displayName}</Text>
            </View>

            {/* Place name + address — an upright paper tag */}
            <TourTarget id={ONBOARDING_MEMORY_DETAIL_TARGET_ID}>
              <View style={styles.placeTag}>
                <Text style={styles.placeName}>{data.place.name}</Text>
                <Text style={styles.address}>
                  📍 {data.place.formattedAddress}
                </Text>
              </View>
            </TourTarget>

            {/* Feeling / note — an upright paper note, clipped in place */}
            {data.feeling ? (
              <View style={styles.noteCard}>
                <Text style={styles.paperclip}>📎</Text>
                <Text style={styles.noteText}>"{data.feeling}"</Text>
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

  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  errorEmoji: { fontSize: 40 },
  errorText: {
    fontSize: 16,
    color: BrandColors.neutralMuted,
    fontWeight: "500",
  },

  scroll: { paddingBottom: 40 },

  // Hero polaroid
  heroSection: {
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: HERO_MARGIN,
  },
  heroTilt: {
    alignItems: "center",
  },
  heroPin: {
    width: HERO_PIN_SIZE,
    height: HERO_PIN_SIZE,
    marginBottom: -10,
    zIndex: 2,
  },
  heroFrame: {
    backgroundColor: POLAROID.frameColor,
    borderRadius: POLAROID.radius,
    paddingTop: POLAROID.borderTop,
    paddingLeft: POLAROID.borderSide,
    paddingRight: POLAROID.borderSide,
    paddingBottom: POLAROID.borderBottom,
    ...POLAROID.shadow,
  },
  heroScroll: {
    height: HERO_PHOTO_HEIGHT,
  },
  heroPhoto: {
    width: HERO_PHOTO_WIDTH,
    height: HERO_PHOTO_HEIGHT,
    borderRadius: 1,
    backgroundColor: BrandColors.gray200,
  },
  heroPlaceholder: {
    width: HERO_PHOTO_WIDTH,
    height: HERO_PHOTO_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BrandColors.primaryMuted,
    borderRadius: 1,
  },
  heroPlaceholderText: { fontSize: 48 },
  heroSticker: {
    position: "absolute",
    top: HERO_PIN_SIZE - 18,
    right: -6,
  },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
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
    paddingTop: 24,
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

  // Place — upright paper tag
  placeTag: {
    backgroundColor: BrandColors.paper,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
    ...POLAROID.shadow,
  },
  placeName: {
    fontSize: 20,
    fontWeight: "700",
    color: BrandColors.ink,
    lineHeight: 26,
  },
  address: {
    fontSize: 13,
    color: BrandColors.inkMuted,
    lineHeight: 19,
    flexWrap: "wrap",
  },

  // Feeling — upright paper note with a paperclip
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
