import Ionicons from "@expo/vector-icons/Ionicons";
import { memo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import {
  ADDY_BORDER_WIDTH,
  AddyColors,
  AddyFonts,
  AddyRadius,
  AddyShadow,
} from "@/constants/theme";
import type { PlaceSource } from "@/stores/create-pin-handoff.store";
import type { PlaceSuggestion } from "@/services/places";

type AddressBarProps = {
  place: PlaceSuggestion | null;
  source: PlaceSource;
  resolving: boolean;
  onPress: () => void;
};

/** Where the memory gets pinned. Tapping opens the place picker. */
export const AddressBar = memo(function AddressBar({
  place,
  source,
  resolving,
  onPress,
}: AddressBarProps) {
  let title: string;
  let subtitle: string;
  if (place) {
    title = place.name;
    subtitle =
      source === "auto"
        ? "from your location · tap to change"
        : place.address || "tap to change";
  } else if (resolving) {
    title = "Finding where you are…";
    subtitle = "using your location";
  } else {
    title = "Choose a place";
    subtitle = "location is off · tap to pick";
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={place ? `Place: ${place.name}. Change place` : title}
      style={({ pressed }) => [styles.bar, AddyShadow.soft, pressed && styles.pressed]}
    >
      <View style={styles.icon}>
        {resolving && !place ? (
          <ActivityIndicator size="small" color={AddyColors.ink} />
        ) : (
          <Text style={styles.pin}>📍</Text>
        )}
      </View>
      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={AddyColors.inkMuted} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: AddyRadius.input,
    borderWidth: ADDY_BORDER_WIDTH,
    borderColor: AddyColors.line,
    backgroundColor: AddyColors.white,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AddyColors.cyan,
    alignItems: "center",
    justifyContent: "center",
  },
  pin: { fontSize: 16 },
  text: { flex: 1, gap: 1 },
  title: {
    fontFamily: AddyFonts.bodySemiBold,
    fontSize: 15,
    color: AddyColors.ink,
  },
  subtitle: {
    fontFamily: AddyFonts.body,
    fontSize: 12,
    color: AddyColors.inkMuted,
  },
  pressed: { opacity: 0.8 },
});
