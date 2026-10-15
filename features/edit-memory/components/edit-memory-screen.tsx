import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Crypto from "expo-crypto";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { GlossyButton } from "@/components/ui/glossy-button";
import { StickerCard } from "@/components/ui/sticker-card";
import { ToggleRow } from "@/components/ui/toggle-row";
import { BrandColors } from "@/constants/theme";
import { MoodScorePicker } from "@/features/camera/components/mood-score-picker";
import { ensureMediaLibraryReadAccess } from "@/features/camera/permissions/media-library-access";
import { cameraLayout } from "@/features/camera/styles/shared-styles";
import { useEditMemorySave } from "@/features/edit-memory/hooks/use-edit-memory-save";
import {
  type EditPhoto,
  useEditMemoryStore,
} from "@/features/edit-memory/store/edit-memory-store";
import { safeBack } from "@/lib/navigation/safe-router";
import { useMemoryQuery } from "@/lib/query/hooks";

/** Same cap as the server and the multi-upload endpoint. */
const MAX_PHOTOS = 20;
const THUMB_SIZE = 88;

function photoUri(photo: EditPhoto) {
  return photo.kind === "remote" ? photo.url : photo.uri;
}

export function EditMemoryScreen({ id }: { id: string }) {
  const insets = useSafeAreaInsets();
  const { data: memory, isLoading } = useMemoryQuery(id);
  const { save, saving } = useEditMemorySave(memory);

  const loadedId = useEditMemoryStore((s) => s.memoryId);
  const photos = useEditMemoryStore((s) => s.photos);
  const photosChanged = useEditMemoryStore((s) => s.photosChanged);
  const place = useEditMemoryStore((s) => s.place);
  const placeChanged = useEditMemoryStore((s) => s.placeChanged);
  const moodScore = useEditMemoryStore((s) => s.moodScore);
  const feeling = useEditMemoryStore((s) => s.feeling);
  const visibility = useEditMemoryStore((s) => s.visibility);
  const { load, setPhotos, setMoodScore, setFeeling, setVisibility, clear } =
    useEditMemoryStore.getState();

  useEffect(() => {
    if (memory?.isOwner && loadedId !== memory.id) load(memory);
  }, [memory, loadedId, load]);

  useEffect(() => clear, [clear]);

  const isDirty =
    memory !== undefined &&
    (photosChanged ||
      placeChanged ||
      moodScore !== memory.moodScore ||
      feeling.trim() !== (memory.feeling ?? "") ||
      visibility !== memory.visibility);

  const close = () => safeBack(`/memory/${id}`);

  const confirmClose = () => {
    if (!isDirty) {
      close();
      return;
    }
    Alert.alert("Discard changes?", "Your edits to this memory won't be saved.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: close },
    ]);
  };

  const onSave = async () => {
    if (await save()) close();
  };

  const makeCover = (key: string) => {
    const index = photos.findIndex((p) => p.key === key);
    if (index <= 0) return;
    const next = [...photos];
    const [photo] = next.splice(index, 1);
    setPhotos([photo, ...next]);
  };

  const removePhoto = (key: string) => {
    if (photos.length <= 1) return;
    setPhotos(photos.filter((p) => p.key !== key));
  };

  const addPhotos = async () => {
    const access = await ensureMediaLibraryReadAccess();
    if (access.access === "denied") {
      Alert.alert(
        "Photos access needed",
        "Allow access to your photo library to add photos to this memory.",
        access.canAskAgain
          ? [{ text: "OK" }]
          : [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => void Linking.openSettings() },
            ],
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      quality: 0.9,
    });
    if (result.canceled) return;
    const added: EditPhoto[] = result.assets.map((asset) => ({
      kind: "local",
      key: Crypto.randomUUID(),
      uri: asset.uri,
    }));
    setPhotos([...useEditMemoryStore.getState().photos, ...added].slice(0, MAX_PHOTOS));
  };

  if (isLoading || (memory?.isOwner && loadedId !== memory.id)) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator color={BrandColors.ink} />
      </SafeAreaView>
    );
  }

  if (!memory || !memory.isOwner) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.emptyTitle}>You can&apos;t edit this memory</Text>
        <GlossyButton label="Go back" onPress={close} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          onPress={confirmClose}
          hitSlop={cameraLayout.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={26} color={BrandColors.ink} />
        </Pressable>
        <Text style={styles.title}>Edit memory</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Photos</Text>
          <Text style={styles.hint}>
            Tap a photo to make it the cover. The cover shows on the map.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {photos.map((photo, index) => (
              <Pressable
                key={photo.key}
                onPress={() => makeCover(photo.key)}
                style={styles.thumbWrap}
                accessibilityRole="button"
                accessibilityLabel={index === 0 ? "Cover photo" : "Make cover photo"}
              >
                <Image source={{ uri: photoUri(photo) }} style={styles.thumb} contentFit="cover" />
                {index === 0 ? <Text style={styles.coverBadge}>Cover</Text> : null}
                {photos.length > 1 ? (
                  <Pressable
                    onPress={() => removePhoto(photo.key)}
                    hitSlop={8}
                    style={styles.removeBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Remove photo"
                  >
                    <Ionicons name="close" size={14} color={BrandColors.white} />
                  </Pressable>
                ) : null}
              </Pressable>
            ))}
            {photos.length < MAX_PHOTOS ? (
              <Pressable
                onPress={addPhotos}
                style={[styles.thumb, styles.addTile]}
                accessibilityRole="button"
                accessibilityLabel="Add photos"
              >
                <Ionicons name="add" size={28} color={BrandColors.ink} />
              </Pressable>
            ) : null}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Place</Text>
          <StickerCard style={styles.stretch}>
            <View style={styles.placeCard}>
              <MaterialIcons name="place" size={22} color={BrandColors.primary} />
              <View style={styles.placeText}>
                <Text style={styles.placeName}>{place?.name}</Text>
                <Text style={styles.placeAddress}>{place?.address}</Text>
              </View>
            </View>
          </StickerCard>
          <Pressable onPress={() => router.push("/edit-memory/place")}>
            <Text style={styles.link}>change place</Text>
          </Pressable>
        </View>

        <MoodScorePicker value={moodScore} onChange={setMoodScore} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>What&apos;s on your mind?</Text>
          <TextInput
            value={feeling}
            onChangeText={setFeeling}
            placeholder="A note about this moment…"
            placeholderTextColor={BrandColors.neutralMuted}
            multiline
            maxLength={500}
            style={styles.feelingInput}
            textAlignVertical="top"
          />
        </View>

        <StickerCard style={styles.stretch}>
          <View style={styles.visibilityCard}>
            <ToggleRow
              label="Share with friends"
              description="Friends can see this memory on their map. Off = only you."
              value={visibility === "friends"}
              onValueChange={(next) => setVisibility(next ? "friends" : "private")}
            />
          </View>
        </StickerCard>
      </KeyboardAwareScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(20, insets.bottom) }]}>
        <GlossyButton
          label={saving ? "Saving…" : "Save changes"}
          loading={saving}
          disabled={!isDirty || saving}
          onPress={onSave}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BrandColors.paper },
  center: { alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: cameraLayout.screenPaddingHorizontal,
    paddingVertical: 12,
  },
  headerSpacer: { width: 26 },
  title: { fontSize: 22, fontFamily: "Baloo2-ExtraBold", color: BrandColors.ink },
  scroll: {
    paddingHorizontal: cameraLayout.screenPaddingHorizontal,
    paddingBottom: 32,
    gap: 20,
  },
  section: { gap: 8 },
  sectionLabel: { fontSize: 15, fontWeight: "600", color: BrandColors.neutral },
  hint: { fontSize: 13, color: BrandColors.neutralMuted },
  stretch: { alignSelf: "stretch" },
  thumbWrap: { marginRight: 10, paddingTop: 6, paddingRight: 6 },
  thumb: { width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 12 },
  coverBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: BrandColors.accentPink,
    color: BrandColors.white,
    fontSize: 11,
    fontWeight: "600",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  removeBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: BrandColors.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  addTile: {
    marginTop: 6,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: BrandColors.ink,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BrandColors.gray100,
  },
  placeCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  placeText: { flex: 1, gap: 4 },
  placeName: { fontSize: 16, fontWeight: "600", color: BrandColors.ink },
  placeAddress: { fontSize: 14, color: BrandColors.inkMuted, lineHeight: 20 },
  link: { fontSize: 14, fontWeight: "600", color: BrandColors.link },
  feelingInput: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: BrandColors.neutralBorder,
    borderRadius: cameraLayout.cornerRadiusMd,
    backgroundColor: BrandColors.placeHolder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: BrandColors.neutral,
    lineHeight: 22,
  },
  visibilityCard: { paddingHorizontal: 14 },
  footer: {
    paddingHorizontal: cameraLayout.screenPaddingHorizontal,
    paddingTop: 12,
    backgroundColor: BrandColors.paper,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", color: BrandColors.ink },
});
