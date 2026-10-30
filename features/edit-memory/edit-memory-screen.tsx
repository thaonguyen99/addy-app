import * as Crypto from "expo-crypto";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { GlossyButton } from "@/components/ui/glossy-button";
import { IconCircleButton } from "@/components/ui/icon-circle-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SkyBackground } from "@/components/ui/sky-background";
import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
} from "@/constants/theme";
import { AddressBar } from "@/features/create-pin/components/address-bar";
import { VISIBILITY_OPTIONS } from "@/features/create-pin/components/create-pin-screen";
import { DraftPhoto } from "@/features/create-pin/components/draft-photo";
import { MoodRow } from "@/features/create-pin/components/mood-row";
import {
  MAX_PICKED_PHOTOS,
  openPhotoPicker,
} from "@/features/photo-picker/open-photo-picker";
import {
  TagFriendsSheet,
  type TagFriendsSheetRef,
} from "@/features/memory/tag-friends-sheet";
import { TaggedFriendsRow } from "@/features/memory/tagged-friends-row";
import { useEditMemorySave } from "@/hooks/use-edit-memory-save";
import { safeBack } from "@/lib/safe-router";
import { useMemoryQuery } from "@/services/memories";
import {
  type EditPhoto,
  taggedUsersChanged,
  useEditMemoryStore,
} from "@/stores/edit-memory.store";
import type { AddyMemoryImage } from "@/types/addy-memory";

const MAX_PHOTOS = MAX_PICKED_PHOTOS;
const SIDE_PADDING = 16;

function photoUri(photo: EditPhoto) {
  return photo.kind === "remote" ? photo.url : photo.uri;
}

export function EditMemoryScreen({ id }: { id: string }) {
  const { width } = useWindowDimensions();
  const photoSize = width - SIDE_PADDING * 2;
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
  const taggedUsers = useEditMemoryStore((s) => s.taggedUsers);
  const {
    load,
    setPhotos,
    setMoodScore,
    setFeeling,
    setVisibility,
    setTaggedUsers,
    clear,
  } = useEditMemoryStore.getState();
  const tagSheetRef = useRef<TagFriendsSheetRef>(null);
  const [adding, setAdding] = useState(false);

  // DraftPhoto works on capture images; edit photos map onto them by key.
  const draftImages = useMemo<AddyMemoryImage[]>(
    () =>
      photos.map((photo) => ({
        id: photo.key,
        uri: photoUri(photo),
        sourceType: "uploaded",
        createdAt: "",
      })),
    [photos],
  );

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
      visibility !== memory.visibility ||
      taggedUsersChanged(taggedUsers, memory.taggedUsers));

  const close = () => safeBack(`/memory/${id}`);

  const confirmClose = () => {
    if (!isDirty) {
      close();
      return;
    }
    Alert.alert(
      "Discard changes?",
      "Your edits to this memory won't be saved.",
      [
        { text: "Keep editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: close },
      ],
    );
  };

  const onSave = async () => {
    if (await save()) close();
  };

  const reorderPhotos = (keys: string[]) => {
    const byKey = new Map(photos.map((photo) => [photo.key, photo]));
    const next = keys.flatMap((key) => byKey.get(key) ?? []);
    if (next.length === photos.length) setPhotos(next);
  };

  const removePhoto = (key: string) => {
    if (photos.length <= 1) return;
    setPhotos(photos.filter((p) => p.key !== key));
  };

  const addPhotos = async () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(
        "Edit memory",
        `A memory can hold up to ${MAX_PHOTOS} photos.`,
      );
      return;
    }
    setAdding(true);
    const picked = await openPhotoPicker({
      limit: MAX_PHOTOS - photos.length,
    }).finally(() => setAdding(false));
    if (picked.length === 0) return;
    const added: EditPhoto[] = picked.map((photo) => ({
      kind: "local",
      key: Crypto.randomUUID(),
      uri: photo.uri,
    }));
    setPhotos(
      [...useEditMemoryStore.getState().photos, ...added].slice(0, MAX_PHOTOS),
    );
  };

  if (isLoading || (memory?.isOwner && loadedId !== memory.id)) {
    return (
      <SkyBackground>
        <SafeAreaView style={[styles.flex, styles.center]}>
          <ActivityIndicator color={AddyColors.ink} size="large" />
        </SafeAreaView>
      </SkyBackground>
    );
  }

  if (!memory || !memory.isOwner) {
    return (
      <SkyBackground>
        <SafeAreaView style={[styles.flex, styles.center]}>
          <Text style={styles.emptyTitle}>You can&apos;t edit this memory</Text>
          <GlossyButton label="Go back" onPress={close} />
        </SafeAreaView>
      </SkyBackground>
    );
  }

  return (
    <SkyBackground>
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <IconCircleButton
            icon="close"
            accessibilityLabel="Close"
            onPress={confirmClose}
          />
          <Text style={styles.title}>Edit memory</Text>
          <View style={styles.headerSpacer} />
        </View>

        <KeyboardAvoidingView behavior="padding" style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
          >
            <DraftPhoto
              images={draftImages}
              size={photoSize}
              adding={adding}
              onReorder={reorderPhotos}
              onRemove={removePhoto}
              onAdd={() => void addPhotos()}
            />

            <AddressBar
              place={place}
              source="picked"
              resolving={false}
              onPress={() => router.push("/edit-memory/place")}
            />

            <View style={styles.section}>
              <Text style={styles.label}>Mood</Text>
              <MoodRow value={moodScore} onChange={setMoodScore} />
            </View>

            <TextInput
              value={feeling}
              onChangeText={setFeeling}
              placeholder="add a caption…"
              placeholderTextColor={AddyColors.inkMuted}
              multiline
              maxLength={500}
              style={styles.input}
              accessibilityLabel="Caption"
              textAlignVertical="top"
            />

            <View style={styles.section}>
              <Text style={styles.label}>Who can see</Text>
              <SegmentedControl
                options={VISIBILITY_OPTIONS}
                value={visibility}
                onChange={setVisibility}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Tag friends</Text>
              <TaggedFriendsRow
                users={taggedUsers}
                onRemove={(user) =>
                  setTaggedUsers(taggedUsers.filter((u) => u.id !== user.id))
                }
                onAdd={() => tagSheetRef.current?.present()}
              />
              {visibility === "private" && taggedUsers.length > 0 ? (
                <Text style={styles.hint}>
                  tagged friends can still see it and chat
                </Text>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <GlossyButton
              label={saving ? "Saving…" : "Save changes"}
              loading={saving}
              disabled={!isDirty || saving}
              onPress={() => void onSave()}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <TagFriendsSheet
        ref={tagSheetRef}
        selected={taggedUsers}
        onDone={setTaggedUsers}
      />
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIDE_PADDING,
    paddingVertical: 8,
  },
  title: {
    fontFamily: AddyFonts.title,
    fontSize: 20,
    lineHeight: 30,
    color: AddyColors.ink,
  },
  headerSpacer: { width: 30 },
  content: {
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 4,
    paddingBottom: 24,
    gap: 16,
  },
  section: { gap: 8 },
  label: {
    fontFamily: AddyFonts.titleSemiBold,
    fontSize: 14,
    color: AddyColors.inkMuted,
  },
  hint: {
    fontFamily: AddyFonts.body,
    fontSize: 13,
    color: AddyColors.inkMuted,
  },
  input: {
    minHeight: 80,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: AddyRadius.input,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
    fontFamily: AddyFonts.body,
    fontSize: 15,
    color: AddyColors.ink,
  },
  footer: {
    paddingHorizontal: SIDE_PADDING,
    paddingTop: 8,
    paddingBottom: 8,
  },
  emptyTitle: {
    fontFamily: AddyFonts.title,
    fontSize: 18,
    color: AddyColors.ink,
  },
});
