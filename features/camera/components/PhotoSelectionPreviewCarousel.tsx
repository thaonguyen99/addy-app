import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Image } from "expo-image";
import { memo, useCallback, useEffect, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { BrandColors } from "@/constants/theme";
import { sharedInteractionStyles } from "@/features/camera/styles/shared-styles";
import type { AddyMemoryImage } from "@/types/addy-memory";

type PhotoSelectionPreviewCarouselProps = Readonly<{
  photos: readonly AddyMemoryImage[];
  selectedIds: ReadonlySet<string>;
  /** Bumps FlatList row updates when selection changes. */
  selectionKey: string;
  onToggle: (id: string) => void;
}>;

type SlideProps = Readonly<{
  item: AddyMemoryImage;
  width: number;
  height: number;
  selected: boolean;
  onToggle: (id: string) => void;
}>;

const CarouselSlide = memo(function CarouselSlide({
  item,
  width,
  height,
  selected,
  onToggle,
}: SlideProps) {
  return (
    <Pressable
      onPress={() => onToggle(item.id)}
      style={({ pressed }) => [
        styles.slide,
        { width, height },
        pressed && sharedInteractionStyles.pressedSubtle,
      ]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
    >
      <Image
        source={{ uri: item.uri }}
        style={styles.slideImage}
        contentFit="cover"
      />
      <View
        style={[
          styles.badge,
          item.sourceType === "quick_snap"
            ? styles.badgeSnap
            : styles.badgeUpload,
        ]}
      >
        <MaterialIcons
          name={
            item.sourceType === "quick_snap" ? "photo-camera" : "folder-open"
          }
          size={12}
          color={BrandColors.gray900}
        />
      </View>
      <View
        style={[
          styles.selectionControl,
          selected && styles.selectionControlSelected,
        ]}
      >
        {selected ? (
          <MaterialIcons name="check" size={16} color={BrandColors.white} />
        ) : null}
      </View>
    </Pressable>
  );
});

export const PhotoSelectionPreviewCarousel = memo(
  function PhotoSelectionPreviewCarousel({
    photos,
    selectedIds,
    selectionKey,
    onToggle,
  }: PhotoSelectionPreviewCarouselProps) {
    const { width: screenWidth } = useWindowDimensions();
    const data = photos as AddyMemoryImage[];
    const [activeIndex, setActiveIndex] = useState(0);

    const previewWidth = screenWidth - 32;
    const previewHeight = Math.min(Math.round(previewWidth * 1.15), 400);

    useEffect(() => {
      if (data.length === 0) {
        return;
      }
      if (activeIndex > data.length - 1) {
        setActiveIndex(data.length - 1);
      }
    }, [activeIndex, data.length]);

    const onMomentumScrollEnd = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const x = e.nativeEvent.contentOffset.x;
        const next = Math.round(x / previewWidth);
        setActiveIndex(
          Math.min(Math.max(0, next), Math.max(0, data.length - 1)),
        );
      },
      [data.length, previewWidth],
    );

    const renderItem = useCallback(
      ({ item }: ListRenderItemInfo<AddyMemoryImage>) => (
        <CarouselSlide
          item={item}
          width={previewWidth}
          height={previewHeight}
          selected={selectedIds.has(item.id)}
          onToggle={onToggle}
        />
      ),
      [onToggle, previewHeight, previewWidth, selectedIds],
    );

    const getItemLayout = useCallback(
      (_: unknown, index: number) => ({
        length: previewWidth,
        offset: previewWidth * index,
        index,
      }),
      [previewWidth],
    );

    if (data.length === 0) {
      return null;
    }

    return (
      <View style={styles.wrap}>
        <View style={[styles.carouselFrame, { width: previewWidth }]}>
          <FlatList
            style={{ width: previewWidth }}
            data={data}
            extraData={selectionKey}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            onMomentumScrollEnd={onMomentumScrollEnd}
            getItemLayout={getItemLayout}
          />
        </View>
        <View
          style={styles.dotsRow}
          importantForAccessibility="no-hide-descendants"
        >
          {data.map((p, i) => (
            <View
              key={p.id}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
              accessibilityLabel={`Photo ${i + 1} of ${data.length}`}
            />
          ))}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 16,
    gap: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  carouselFrame: {
    alignSelf: "center",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: BrandColors.gray800,
  },
  slide: {
    backgroundColor: BrandColors.gray800,
    justifyContent: "center",
    overflow: "hidden",
  },
  slideImage: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: "absolute",
    top: 12,
    left: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeSnap: {
    backgroundColor: BrandColors.secondaryYellow,
  },
  badgeUpload: {
    backgroundColor: BrandColors.blueberryMilk,
  },
  selectionControl: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.9)",
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectionControlSelected: {
    backgroundColor: BrandColors.primaryPink,
    borderColor: BrandColors.white,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    flexWrap: "wrap",
    paddingHorizontal: 8,
  },
  dot: {
    borderRadius: 999,
  },
  dotActive: {
    width: 8,
    height: 8,
    backgroundColor: BrandColors.white,
  },
  dotInactive: {
    width: 6,
    height: 6,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
});
