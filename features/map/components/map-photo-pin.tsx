import { StyleSheet, Text, View } from "react-native";

import { PhotoPin } from "@/components/ui/photo-pin";
import { BrandColors } from "@/constants/theme";

type MapPhotoPinProps = {
  imageUrl: string;
  /** When more than one memory shares this place, shows a "+N" corner badge. */
  count?: number;
  /** Marks this as a friend's memory rather than the user's own. */
  isFriend?: boolean;
};

const PIN_SIZE = 72;

/**
 * The map marker: PhotoPin plus two bolt-ons PhotoPin itself doesn't know
 * about — a place's memory count, and an own-vs-friend indicator. PhotoPin's
 * own badge slot is reserved for category, so these render as separate
 * overlays instead of being passed into it.
 */
export function MapPhotoPin({ imageUrl, count, isFriend }: MapPhotoPinProps) {
  return (
    <View style={styles.wrapper}>
      <PhotoPin
        uri={imageUrl}
        size={PIN_SIZE}
        badgeColor={isFriend ? BrandColors.accentPink : BrandColors.accentCyan}
      />
      {count != null && count > 1 ? (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>+{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

export const MAP_PHOTO_PIN_WIDTH = PIN_SIZE;
export const MAP_PHOTO_PIN_HEIGHT = (PIN_SIZE / 100) * 128;

const styles = StyleSheet.create({
  wrapper: { alignItems: "center" },
  countBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 6,
    backgroundColor: BrandColors.accentYellow,
    borderWidth: 2,
    borderColor: BrandColors.ink,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 3,
  },
  countBadgeText: {
    color: BrandColors.ink,
    fontSize: 11,
    fontFamily: "VT323-Regular",
  },
});
