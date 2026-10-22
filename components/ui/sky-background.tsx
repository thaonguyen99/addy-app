import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Svg, { Ellipse } from "react-native-svg";

import { AddyColors, AddyGradients } from "@/constants/theme";

type SkyBackgroundProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Screen wallpaper: pale sky fading to paper, with soft clouds near the top. */
export function SkyBackground({ children, style }: SkyBackgroundProps) {
  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={AddyGradients.sky.colors}
        locations={AddyGradients.sky.locations}
        style={StyleSheet.absoluteFill}
      />
      <Svg
        style={styles.clouds}
        viewBox="0 0 390 220"
        preserveAspectRatio="xMidYMin slice"
        pointerEvents="none"
      >
        <Ellipse cx="70" cy="70" rx="80" ry="22" fill="#FFFFFF" opacity={0.7} />
        <Ellipse cx="110" cy="56" rx="44" ry="20" fill="#FFFFFF" opacity={0.6} />
        <Ellipse cx="315" cy="120" rx="90" ry="20" fill="#FFFFFF" opacity={0.55} />
        <Ellipse cx="290" cy="108" rx="40" ry="16" fill="#FFFFFF" opacity={0.5} />
        <Ellipse cx="200" cy="185" rx="70" ry="14" fill="#FFFFFF" opacity={0.35} />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AddyColors.paper },
  clouds: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
});
