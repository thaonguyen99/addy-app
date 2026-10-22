import { ReactNode, useId } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

import { AddyColors, AddyShadow } from "@/constants/theme";

type GlossyOrbProps = {
  size: number;
  /** White ring around the orb, in px. 0 for none. */
  ringWidth?: number;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Glossy lime orb: radial highlight top-left → lime → limeDeep. Used for the
 * camera tab button, the shutter, and the active mood option.
 */
export function GlossyOrb({
  size,
  ringWidth = 0,
  children,
  style,
}: GlossyOrbProps) {
  // Gradient ids must be unique per instance or orbs share one definition.
  const gradientId = `orb-${useId().replace(/:/g, "")}`;
  const outer = size + ringWidth * 2;

  return (
    <View
      style={[
        styles.ring,
        AddyShadow.soft,
        { width: outer, height: outer, borderRadius: outer / 2 },
        style,
      ]}
    >
      <View style={[styles.content, { width: size, height: size }]}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Defs>
            <RadialGradient id={gradientId} cx="35%" cy="28%" r="75%">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
              <Stop offset="0.28" stopColor={AddyColors.lime} />
              <Stop offset="1" stopColor={AddyColors.limeDeep} />
            </RadialGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 0.75}
            fill={`url(#${gradientId})`}
            stroke={AddyColors.limeDeep}
            strokeWidth={1.5}
          />
        </Svg>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    backgroundColor: AddyColors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
});
