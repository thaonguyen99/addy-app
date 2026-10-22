import { memo } from "react";
import { StyleSheet, Text } from "react-native";

import { SoftShadowBox } from "@/components/ui/soft-shadow";
import { MAP_LABEL_NAVY } from "@/constants/map-style";
import { BrandColors } from "@/constants/theme";

const SIZE = 48;

type ClusterMarkerProps = {
  count: number;
};

/** Soft white circle marker for a cluster of nearby pins. */
export const ClusterMarker = memo(function ClusterMarker({
  count,
}: ClusterMarkerProps) {
  return (
    <SoftShadowBox radius={SIZE / 2} style={styles.circle}>
      <Text style={styles.count}>{count}</Text>
    </SoftShadowBox>
  );
});

const styles = StyleSheet.create({
  circle: {
    width: SIZE,
    height: SIZE,
    backgroundColor: BrandColors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  count: {
    fontSize: 16,
    fontFamily: "Baloo2-SemiBold",
    color: MAP_LABEL_NAVY,
  },
});
