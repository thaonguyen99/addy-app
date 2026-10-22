import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";

type StickerShadowBoxProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  radius?: number;
  shadowColor?: string;
  shadowOffset?: number;
  enabled?: boolean;
};

/**
 * Sticker shadow effect, disabled app-wide: renders children in a plain
 * View with no shadow. Props are kept for call-site compatibility.
 */
export function StickerShadowBox({ children, style }: StickerShadowBoxProps) {
  return <View style={style}>{children}</View>;
}
