import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as MediaLibrary from "expo-media-library";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  type ComponentProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  AddyColors,
  AddyFonts,
  AddyGradients,
  AddyRadius,
} from "@/constants/theme";
import {
  VIEWFINDER_RADIUS,
  ViewfinderOverlay,
} from "@/features/camera/components/viewfinder-overlay";
import {
  ALL_PHOTOS_TITLE,
  AlbumSheet,
} from "@/features/photo-picker/components/album-sheet";
import { CropViewport } from "@/features/photo-picker/components/crop-viewport";
import {
  type CropTransform,
  IDENTITY_CROP,
  type ImageSize,
  cropToSquare,
  fillCrop,
  flipCrop,
  rotateCrop,
} from "@/features/photo-picker/square-crop";
import { useLibraryPhotos } from "@/features/photo-picker/use-library-photos";
import { usePhotoAlbums } from "@/features/photo-picker/use-photo-albums";
import {
  type PickedPhoto,
  usePhotoPickerStore,
} from "@/stores/photo-picker.store";
import { exifTakenAt } from "@/utils/exif-taken-at";

const SIDE_PADDING = 16;
const COLUMNS = 4;
const GAP = 6;
const TILE_RADIUS = 12;
/** Header width kept clear on each side for close / "Next · 20". */
const HEADER_SIDE_SLOT = SIDE_PADDING + 116;
const SELECTED_BORDER = 3;
// Same translucent chrome as the capture screen's ghost buttons.
const GHOST_BG = "rgba(255, 255, 255, 0.12)";
const GHOST_BORDER = "rgba(255, 255, 255, 0.24)";

type IconName = ComponentProps<typeof Ionicons>["name"];

function librarySize(asset: MediaLibrary.Asset): ImageSize {
  return asset.width > 0 && asset.height > 0
    ? { width: asset.width, height: asset.height }
    : { width: 1, height: 1 };
}

/**
 * In-app library picker: the photo on top is framed into the square post
 * crop (drag / pinch, rotate / flip / fill), the grid below picks photos in
 * order, each keeping its own framing. Opened through `openPhotoPicker`.
 */
export function PhotoPickerScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const side = Math.min(width - SIDE_PADDING * 2, Math.round(height * 0.42));
  const tile = (width - SIDE_PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

  const limit = usePhotoPickerStore((s) => s.request?.limit ?? 1);
  const [album, setAlbum] = useState<{ id: string | null; title: string }>({
    id: null,
    title: ALL_PHOTOS_TITLE,
  });
  const [albumSheetOpen, setAlbumSheetOpen] = useState(false);
  const albums = usePhotoAlbums(albumSheetOpen);
  const { assets, loaded, limited, loadMore, manage } = useLibraryPhotos(
    album.id,
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  // Decoded sizes, when they differ from what the library reported.
  const [sizes, setSizes] = useState<Record<string, ImageSize>>({});
  const transforms = useRef(new Map<string, CropTransform>());
  // Bumped when a button (not a gesture) changes the shown photo's framing,
  // re-keying the viewport so it restarts from the new framing.
  const [edits, setEdits] = useState(0);
  const [busy, setBusy] = useState(false);
  // Every photo seen in any album, so picks survive switching albums.
  const known = useRef(new Map<string, MediaLibrary.Asset>());
  const [recentCoverUri, setRecentCoverUri] = useState<string>();

  // Leaving any other way than Next (close, swipe, back) is a cancel.
  useEffect(() => () => usePhotoPickerStore.getState().settle([]), []);

  useEffect(() => {
    for (const asset of assets) known.current.set(asset.id, asset);
    if (album.id === null && assets[0]) setRecentCoverUri(assets[0].uri);
    // Show the newest photo until the user taps one.
    if (!previewId && assets[0]) setPreviewId(assets[0].id);
  }, [assets, album.id, previewId]);

  const preview = previewId ? known.current.get(previewId) : undefined;

  const onTap = (id: string) => {
    if (!selected.includes(id)) {
      if (limit === 1) {
        setSelected([id]);
      } else if (selected.length >= limit) {
        Alert.alert("Photos", `You can pick up to ${limit} photos here.`);
        return;
      } else {
        setSelected([...selected, id]);
      }
      setPreviewId(id);
      return;
    }
    // Tapping a picked photo shows it; tapping the one shown un-picks it.
    if (previewId !== id) {
      setPreviewId(id);
      return;
    }
    unpick(id);
  };

  const unpick = (id: string) => {
    const rest = selected.filter((s) => s !== id);
    setSelected(rest);
    if (id === previewId && rest.length > 0) setPreviewId(rest[rest.length - 1]);
  };

  const onNext = async () => {
    setBusy(true);
    try {
      const photos: PickedPhoto[] = [];
      // One at a time: each full-size decode is large.
      for (const id of selected) {
        const asset = known.current.get(id);
        if (!asset) continue;
        const info = await MediaLibrary.getAssetInfoAsync(asset);
        const uri = await cropToSquare(
          info.localUri ?? asset.uri,
          sizes[id] ?? librarySize(asset),
          transforms.current.get(id) ?? IDENTITY_CROP,
        );
        photos.push({
          uri,
          takenAt: exifTakenAt(
            info.exif as Record<string, unknown> | undefined,
          ),
        });
      }
      usePhotoPickerStore.getState().settle(photos);
      router.back();
    } catch (error) {
      console.warn("[photo-picker] could not crop", error);
      Alert.alert("Photos", "Couldn't prepare that photo. Please try again.");
      setBusy(false);
    }
  };

  const onImageSize = useCallback(
    (size: ImageSize) => {
      if (previewId) setSizes((prev) => ({ ...prev, [previewId]: size }));
    },
    [previewId],
  );

  const onCropChange = useCallback(
    (transform: CropTransform) => {
      if (previewId) transforms.current.set(previewId, transform);
    },
    [previewId],
  );

  const previewCrop = preview
    ? (transforms.current.get(preview.id) ?? IDENTITY_CROP)
    : IDENTITY_CROP;

  const editPreview = (edit: (t: CropTransform) => CropTransform) => {
    if (!preview) return;
    transforms.current.set(preview.id, edit(previewCrop));
    setEdits((n) => n + 1);
  };

  const editTools: {
    icon: IconName;
    label: string;
    edit: (t: CropTransform) => CropTransform;
    on?: boolean;
  }[] = [
    { icon: "refresh", label: "Rotate", edit: rotateCrop },
    {
      icon: "swap-horizontal",
      label: "Flip",
      edit: flipCrop,
      on: previewCrop.flipped,
    },
    { icon: "square-outline", label: "Fill the square", edit: fillCrop },
  ];

  const canNext = !busy && selected.length > 0;

  return (
    // Padded from the root insets: a SafeAreaView inside the full-screen
    // modal measures no top inset, which put the header under the status bar.
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}
        >
          <Ionicons name="close" size={24} color={AddyColors.white} />
        </Pressable>

        <Pressable
          onPress={() => setAlbumSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`Album: ${album.title}`}
          style={({ pressed }) => [
            styles.albumPill,
            // Clear of the corner buttons, so a long name never runs under them.
            { maxWidth: width - 2 * HEADER_SIDE_SLOT },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.albumTitle} numberOfLines={1}>
            {album.title}
          </Text>
          <Ionicons name="caret-down" size={14} color={AddyColors.white} />
        </Pressable>

        <Pressable
          onPress={() => void onNext()}
          disabled={!canNext}
          hitSlop={8}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.next,
            !canNext && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={AddyGradients.limeGloss}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.nextText}>
            {selected.length > 0 ? `Next · ${selected.length}` : "Next"}
          </Text>
        </Pressable>
      </View>

      {/* Outside the list, so dragging the photo never scrolls the grid. */}
      <View style={[styles.frame, { width: side, height: side }]}>
        {preview ? (
          <CropViewport
            key={`${preview.id}:${edits}`}
            uri={preview.uri}
            side={side}
            imageSize={sizes[preview.id] ?? librarySize(preview)}
            initial={previewCrop}
            onImageSize={onImageSize}
            onChange={onCropChange}
          />
        ) : loaded ? (
          <Text style={styles.emptyText}>No photos to show</Text>
        ) : (
          <ActivityIndicator color={AddyColors.white} />
        )}
        <ViewfinderOverlay />
        {preview && !busy ? (
          <View style={styles.editBar}>
            {editTools.map((tool) => (
              <Pressable
                key={tool.label}
                onPress={() => editPreview(tool.edit)}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={tool.label}
                accessibilityState={
                  tool.on === undefined ? undefined : { selected: tool.on }
                }
                style={({ pressed }) => [
                  styles.editTool,
                  tool.on && styles.editToolOn,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={tool.icon}
                  size={20}
                  color={tool.on ? AddyColors.ink : AddyColors.white}
                />
              </Pressable>
            ))}
          </View>
        ) : null}
        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={AddyColors.white} size="large" />
          </View>
        ) : null}
      </View>

      {limited ? (
        <Pressable onPress={() => void manage()} style={styles.limitedRow}>
          <Text style={styles.limitedText}>
            Addy can only see the photos you shared.{" "}
            <Text style={styles.limitedLink}>Manage</Text>
          </Text>
        </Pressable>
      ) : null}

      <FlatList
        data={assets}
        keyExtractor={(a) => a.id}
        numColumns={COLUMNS}
        style={styles.grid}
        columnWrapperStyle={styles.row}
        contentContainerStyle={[
          styles.gridContent,
          { paddingBottom: insets.bottom + GAP },
        ]}
        onEndReached={loadMore}
        onEndReachedThreshold={1.5}
        ListEmptyComponent={
          loaded ? (
            <Text style={styles.emptyGrid}>No photos in this album</Text>
          ) : null
        }
        renderItem={({ item }) => {
          const order = selected.indexOf(item.id);
          const picked = order >= 0;
          const shown = item.id === previewId;
          return (
            <Pressable
              onPress={() => onTap(item.id)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityState={{ selected: picked }}
              style={[styles.tile, { width: tile, height: tile }]}
            >
              <Image
                source={{ uri: item.uri }}
                recyclingKey={item.id}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
              {picked ? (
                <View pointerEvents="none" style={styles.pickedRing}>
                  {shown ? <View style={styles.shownRing} /> : null}
                </View>
              ) : shown ? (
                <View pointerEvents="none" style={styles.shownOnlyRing} />
              ) : null}
              {picked ? (
                <Pressable
                  onPress={() => unpick(item.id)}
                  disabled={busy}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove photo ${order + 1}`}
                  style={styles.badge}
                >
                  <Text style={styles.badgeText}>{order + 1}</Text>
                </Pressable>
              ) : null}
            </Pressable>
          );
        }}
      />

      <AlbumSheet
        visible={albumSheetOpen}
        albums={albums}
        selectedId={album.id}
        recentCoverUri={recentCoverUri}
        onSelect={(next) => {
          setAlbumSheetOpen(false);
          setAlbum(next);
        }}
        onClose={() => setAlbumSheetOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AddyColors.captureBg },
  // Close and Next sit in the corners; the album name stays centered.
  header: {
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  close: {
    position: "absolute",
    left: SIDE_PADDING,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  albumPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: AddyRadius.pill,
  },
  albumTitle: {
    flexShrink: 1,
    fontFamily: AddyFonts.title,
    fontSize: 18,
    color: AddyColors.white,
  },
  albumLimit: {
    fontFamily: AddyFonts.tech,
    fontSize: 18,
    color: "rgba(255, 255, 255, 0.6)",
  },
  next: {
    position: "absolute",
    right: SIDE_PADDING,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: AddyRadius.pill,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: {
    fontFamily: AddyFonts.title,
    fontSize: 17,
    color: AddyColors.ink,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  frame: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
    marginBottom: 14,
    borderRadius: VIEWFINDER_RADIUS,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  editBar: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: AddyRadius.pill,
    backgroundColor: "rgba(20, 21, 25, 0.7)",
    borderWidth: 1.5,
    borderColor: GHOST_BORDER,
  },
  editTool: {
    borderRadius: AddyRadius.pill,
    alignItems: "center",
    justifyContent: "center",
    padding: 2,
  },
  editToolOn: { backgroundColor: AddyColors.lime },
  busy: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  emptyText: {
    fontFamily: AddyFonts.bodyMedium,
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.6)",
  },
  limitedRow: {
    paddingHorizontal: SIDE_PADDING,
    paddingBottom: 12,
  },
  limitedText: {
    fontFamily: AddyFonts.body,
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
  },
  limitedLink: { fontFamily: AddyFonts.bodySemiBold, color: AddyColors.cyan },
  grid: { flex: 1 },
  gridContent: { paddingHorizontal: SIDE_PADDING },
  row: { gap: GAP, marginBottom: GAP },
  emptyGrid: {
    fontFamily: AddyFonts.bodyMedium,
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    marginTop: 24,
  },
  tile: {
    borderRadius: TILE_RADIUS,
    overflow: "hidden",
    backgroundColor: GHOST_BG,
  },
  pickedRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: TILE_RADIUS,
    borderWidth: SELECTED_BORDER,
    borderColor: AddyColors.lime,
  },
  // Inside the lime ring: marks the picked photo that's in the frame.
  shownRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: TILE_RADIUS - SELECTED_BORDER,
    borderWidth: SELECTED_BORDER,
    borderColor: AddyColors.captureBg,
  },
  shownOnlyRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: TILE_RADIUS,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: AddyColors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontFamily: AddyFonts.bodyBold,
    fontSize: 12,
    color: AddyColors.ink,
  },
});
