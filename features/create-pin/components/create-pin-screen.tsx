import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { BrandColors } from "@/constants/theme";
import { ToggleRow } from "@/components/ui/toggle-row";
import { AuthPrimaryButton } from "@/features/auth/components/auth-primary-button";
import { MOOD_SCORE_OPTIONS } from "@/features/camera/constants/mood-score";
import { useCreatePinSubmit } from "@/features/create-pin/hooks/use-create-pin-submit";
import { useCreatePinHandoffStore } from "@/features/create-pin/store/create-pin-handoff-store";
import { safeBack } from "@/lib/navigation/safe-router";

function moodEmoji(score: number | null): string | null {
  if (score === null) return null;
  return MOOD_SCORE_OPTIONS.find((o) => o.score === score)?.emoji ?? null;
}

export function CreatePinScreen() {
  const images = useCreatePinHandoffStore((s) => s.images);
  const selectedPlace = useCreatePinHandoffStore((s) => s.selectedPlace);
  const moodScore = useCreatePinHandoffStore((s) => s.moodScore);
  const feeling = useCreatePinHandoffStore((s) => s.feeling);
  const visibility = useCreatePinHandoffStore((s) => s.visibility);
  const setVisibility = useCreatePinHandoffStore((s) => s.setVisibility);
  const { submit, submitting } = useCreatePinSubmit(images);

  const onSubmit = async () => {
    await submit();
  };

  if (images.length === 0 || !selectedPlace) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>
            {!images.length ? "No photos selected" : "No place selected"}
          </Text>
          <AuthPrimaryButton
            label="Go back"
            onPress={() => safeBack("/place-selection")}
          />
        </View>
      </SafeAreaView>
    );
  }

  const emoji = moodEmoji(moodScore);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Review your pin</Text>
        <Text style={styles.subtitle}>
          All selected photos upload when you save. The first photo is your
          cover on the map.
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {images.map((img, index) => (
            <View key={img.id} style={styles.thumbWrap}>
              <Image source={{ uri: img.uri }} style={styles.thumb} />
              {index === 0 ? (
                <Text style={styles.coverBadge}>Cover</Text>
              ) : null}
            </View>
          ))}
        </ScrollView>

        <View style={styles.placeCard}>
          <MaterialIcons
            name="place"
            size={22}
            color={BrandColors.primary}
          />
          <View style={styles.placeTextWrap}>
            <Text style={styles.placeName}>{selectedPlace.name}</Text>
            <Text style={styles.placeAddress}>{selectedPlace.address}</Text>
          </View>
        </View>

        <Pressable
          onPress={() => safeBack("/place-selection")}
          style={styles.changePlaceBtn}
        >
          <Text style={styles.changePlaceText}>Change place</Text>
        </Pressable>

        {(emoji || feeling.trim()) ? (
          <View style={styles.metaSection}>
            <Text style={styles.metaLabel}>Your moment</Text>
            {emoji ? (
              <Text style={styles.moodEmoji}>{emoji}</Text>
            ) : null}
            {feeling.trim() ? (
              <Text style={styles.feelingText}>{feeling.trim()}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.visibilityCard}>
          <ToggleRow
            label="Share with friends"
            description="Friends can see this memory on their map. Off = only you."
            value={visibility === "friends"}
            onValueChange={(next) =>
              setVisibility(next ? "friends" : "private")
            }
          />
        </View>

        <AuthPrimaryButton
          label="Save memory"
          loading={submitting}
          onPress={onSubmit}
        />
        <Pressable onPress={() => safeBack("/place-selection")}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.gray900 },
  scroll: { padding: 24, gap: 14, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "700", color: BrandColors.neutral },
  subtitle: { fontSize: 15, color: BrandColors.neutralMuted, lineHeight: 22 },
  thumbWrap: { marginRight: 10, position: "relative" },
  thumb: { width: 88, height: 88, borderRadius: 12 },
  coverBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: BrandColors.primary,
    color: BrandColors.neutral,
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  placeCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.neutralBorder,
    backgroundColor: BrandColors.secondary,
  },
  placeTextWrap: {
    flex: 1,
    gap: 4,
  },
  placeName: {
    fontSize: 16,
    fontWeight: "600",
    color: BrandColors.neutral,
  },
  placeAddress: {
    fontSize: 14,
    color: BrandColors.neutralMuted,
    lineHeight: 20,
  },
  changePlaceBtn: {
    alignSelf: "flex-start",
    marginTop: -6,
  },
  changePlaceText: {
    fontSize: 14,
    fontWeight: "600",
    color: BrandColors.primary,
  },
  metaSection: {
    gap: 6,
    padding: 14,
    borderRadius: 12,
    backgroundColor: BrandColors.primaryMuted,
  },
  visibilityCard: {
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BrandColors.neutralBorder,
    backgroundColor: BrandColors.secondary,
  },
  metaLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: BrandColors.neutralMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  moodEmoji: {
    fontSize: 32,
  },
  feelingText: {
    fontSize: 15,
    color: BrandColors.neutral,
    lineHeight: 22,
  },
  cancel: {
    textAlign: "center",
    color: BrandColors.neutralMuted,
    fontSize: 15,
    marginTop: 4,
  },
  empty: { flex: 1, justifyContent: "center", padding: 24, gap: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: BrandColors.neutral },
});
