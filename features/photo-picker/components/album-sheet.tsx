import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideOutDown,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AddyColors, AddyFonts, AddyRadius } from "@/constants/theme";
import type { PhotoAlbum } from "@/features/photo-picker/use-photo-albums";

export const ALL_PHOTOS_TITLE = "Recents";

type AlbumSheetProps = {
  visible: boolean;
  /** Null while loading. */
  albums: PhotoAlbum[] | null;
  /** Null = all photos. */
  selectedId: string | null;
  /** Cover for the all-photos row. */
  recentCoverUri: string | undefined;
  onSelect: (album: { id: string | null; title: string }) => void;
  onClose: () => void;
};

/**
 * Album list for the photo picker. Rendered inside the screen (not a portal)
 * so it works on top of the picker's native modal, like ConfirmSheet.
 */
export function AlbumSheet({
  visible,
  albums,
  selectedId,
  recentCoverUri,
  onSelect,
  onClose,
}: AlbumSheetProps) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  const rows: { id: string | null; title: string; coverUri?: string }[] = [
    { id: null, title: ALL_PHOTOS_TITLE, coverUri: recentCoverUri },
    ...(albums ?? []),
  ];

  return (
    <View style={StyleSheet.absoluteFill} accessibilityViewIsModal>
      <Animated.View
        entering={FadeIn.duration(150)}
        exiting={FadeOut.duration(150)}
        style={[StyleSheet.absoluteFill, styles.backdrop]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close albums"
        />
      </Animated.View>
      <Animated.View
        entering={SlideInDown.duration(220)}
        exiting={SlideOutDown.duration(180)}
        style={[styles.card, { paddingBottom: insets.bottom + 8 }]}
      >
        <View style={styles.handle} />
        <Text style={styles.title}>Albums</Text>
        <FlatList
          data={rows}
          keyExtractor={(row) => row.id ?? "all"}
          ListFooterComponent={
            albums ? null : (
              <ActivityIndicator color={AddyColors.white} style={styles.loading} />
            )
          }
          renderItem={({ item }) => {
            const active = item.id === selectedId;
            return (
              <Pressable
                onPress={() => onSelect({ id: item.id, title: item.title })}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                {item.coverUri ? (
                  <Image
                    source={{ uri: item.coverUri }}
                    recyclingKey={item.id ?? "all"}
                    style={styles.cover}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.cover} />
                )}
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {active ? (
                  <Ionicons name="checkmark" size={20} color={AddyColors.lime} />
                ) : null}
              </Pressable>
            );
          }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(0, 0, 0, 0.5)" },
  card: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "70%",
    paddingTop: 10,
    paddingHorizontal: 16,
    backgroundColor: "#1E1F24",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.24)",
    marginBottom: 6,
  },
  title: {
    fontFamily: AddyFonts.title,
    fontSize: 20,
    lineHeight: 30,
    color: AddyColors.white,
    textAlign: "center",
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  pressed: { opacity: 0.7 },
  cover: {
    width: 52,
    height: 52,
    borderRadius: AddyRadius.tile * 2,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  rowTitle: {
    flex: 1,
    fontFamily: AddyFonts.bodySemiBold,
    fontSize: 16,
    color: AddyColors.white,
  },
  loading: { marginVertical: 16 },
});
