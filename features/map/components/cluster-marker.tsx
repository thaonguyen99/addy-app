import { StyleSheet, Text, View } from "react-native";

import { BrandColors } from "@/constants/theme";

type ClusterMarkerProps = {
  count: number;
};

/** A group of nearby-but-distinct places, collapsed at the current zoom level. */
export function ClusterMarker({ count }: ClusterMarkerProps) {
  return (
    <View style={styles.bubble}>
      <Text style={styles.text}>{count}</Text>
    </View>
  );
}

const SIZE = 44;

const styles = StyleSheet.create({
  bubble: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: BrandColors.primary,
    borderWidth: 2,
    borderColor: BrandColors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: BrandColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  text: {
    color: BrandColors.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
