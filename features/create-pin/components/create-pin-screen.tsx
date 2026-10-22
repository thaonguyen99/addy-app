import {
  type NavigationAction,
  useNavigation,
  usePreventRemove,
} from "@react-navigation/native";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";

import { ConfirmSheet } from "@/components/ui/confirm-sheet";
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
import { useCameraSession } from "@/features/camera/context/camera-session-context";
import { useGalleryPick } from "@/features/camera/hooks/use-gallery-pick";
import { AddressBar } from "@/features/create-pin/components/address-bar";
import { DraftPhoto } from "@/features/create-pin/components/draft-photo";
import { MoodRow } from "@/features/create-pin/components/mood-row";
import { useAutoPlace } from "@/features/create-pin/hooks/use-auto-place";
import { useCreatePinSubmit } from "@/features/create-pin/hooks/use-create-pin-submit";
import { useCreatePinHandoffStore } from "@/features/create-pin/store/create-pin-handoff-store";
import { safeBack } from "@/lib/navigation/safe-router";
import type { MemoryVisibility } from "@/types/api";

const SIDE_PADDING = 16;

const VISIBILITY_OPTIONS = [
  { value: "private", label: "only me" },
  { value: "friends", label: "friends" },
] as const satisfies readonly { value: MemoryVisibility; label: string }[];

/** One-screen create flow: photo, place, mood, caption, who can see, Pin it. */
export function CreatePinScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const photoSize = width - SIDE_PADDING * 2;

  const images = useCreatePinHandoffStore((s) => s.images);
  const selectedPlace = useCreatePinHandoffStore((s) => s.selectedPlace);
  const placeSource = useCreatePinHandoffStore((s) => s.placeSource);
  const moodScore = useCreatePinHandoffStore((s) => s.moodScore);
  const feeling = useCreatePinHandoffStore((s) => s.feeling);
  const visibility = useCreatePinHandoffStore((s) => s.visibility);
  const {
    addImages,
    removeImage,
    reorderImages,
    setMoodScore,
    setFeeling,
    setVisibility,
    clear,
  } = useCreatePinHandoffStore.getState();

  const { removeCapturedPhoto, clearAllDrafts } = useCameraSession();
  const { pick, picking } = useGalleryPick();
  const { resolving } = useAutoPlace();
  const { submit, submitting } = useCreatePinSubmit(images);

  // Leaving with a photo in the draft asks first — the close button, the
  // Android back button and the iOS swipe-down all land here.
  const [allowLeave, setAllowLeave] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const pendingActionRef = useRef<NavigationAction | null>(null);

  usePreventRemove(!allowLeave && images.length > 0, ({ data }) => {
    pendingActionRef.current = data.action;
    setConfirmVisible(true);
  });

  useEffect(() => {
    if (allowLeave && pendingActionRef.current) {
      navigation.dispatch(pendingActionRef.current);
      pendingActionRef.current = null;
    }
  }, [allowLeave, navigation]);

  const onDiscard = useCallback(async () => {
    setConfirmVisible(false);
    await clearAllDrafts();
    clear();
    setAllowLeave(true);
  }, [clearAllDrafts, clear]);

  const onAddPhotos = useCallback(async () => {
    addImages(await pick());
  }, [addImages, pick]);

  const onRemovePhoto = useCallback(
    (id: string) => {
      removeImage(id);
      void removeCapturedPhoto(id);
    },
    [removeImage, removeCapturedPhoto],
  );

  const onPinIt = async () => {
    // The save closes the whole flow itself; don't intercept that.
    setAllowLeave(true);
    const entry = await submit();
    if (!entry) setAllowLeave(false);
  };

  // The draft is cleared as the flow closes after a save — render nothing
  // for that last frame instead of an empty form.
  if (images.length === 0) return <SkyBackground />;

  return (
    <SkyBackground>
      <SafeAreaView style={styles.flex} edges={["top", "bottom"]}>
        <View style={styles.header}>
          <IconCircleButton
            icon="close"
            accessibilityLabel="Close"
            onPress={() => safeBack("/capture")}
          />
          <Text style={styles.title}>New memory</Text>
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
              images={images}
              size={photoSize}
              adding={picking}
              onReorder={reorderImages}
              onRemove={onRemovePhoto}
              onAdd={() => void onAddPhotos()}
            />

            <AddressBar
              place={selectedPlace}
              source={placeSource}
              resolving={resolving}
              onPress={() => router.push("/place-selection")}
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
              maxLength={500}
              style={styles.input}
              accessibilityLabel="Caption"
              returnKeyType="done"
              submitBehavior="blurAndSubmit"
            />

            <View style={styles.section}>
              <Text style={styles.label}>Who can see</Text>
              <SegmentedControl
                options={VISIBILITY_OPTIONS}
                value={visibility}
                onChange={setVisibility}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <GlossyButton
              label="📍 Pin it"
              onPress={() => void onPinIt()}
              loading={submitting}
              disabled={!selectedPlace}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ConfirmSheet
        visible={confirmVisible}
        title="Discard this memory?"
        message="Your photo and anything you wrote will be gone."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onConfirm={() => void onDiscard()}
        onCancel={() => {
          pendingActionRef.current = null;
          setConfirmVisible(false);
        }}
      />
    </SkyBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  input: {
    minHeight: 48,
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
});
