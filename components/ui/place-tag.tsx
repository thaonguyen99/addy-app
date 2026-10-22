import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { AddyColors, AddyFonts, AddyRadius } from "@/constants/theme";

type PlaceTagProps = {
  name: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Cyan "📍 Place name" pill. Uses Be Vietnam Pro, not VT323: place names are
 * often long and Vietnamese, and VT323 has no diacritics.
 */
export function PlaceTag({ name, style }: PlaceTagProps) {
  return (
    <View style={[styles.tag, style]}>
      <Text style={styles.text} numberOfLines={1}>
        📍 {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    backgroundColor: AddyColors.cyan,
    borderRadius: AddyRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontFamily: AddyFonts.bodySemiBold,
    fontSize: 12,
    color: AddyColors.ink,
  },
});
