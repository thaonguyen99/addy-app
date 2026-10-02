import { Tooltip, type TooltipProps } from "@wrack/react-native-tour-guide";
import { StyleSheet, View } from "react-native";

/**
 * The library's Tooltip positions itself inside an absolute, zIndex-10000
 * container with no pointerEvents, and for a "top" tooltip that container
 * runs down past the target — over the spotlight, so onSpotlightPress never
 * fires. Clip a "top" tooltip to the area above its target (clipped views
 * aren't hit-testable) and let touches around the tooltip fall through.
 */
export function renderClippedTooltip(props: TooltipProps) {
  if (props.tooltipPosition !== "top") return <Tooltip {...props} />;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.clip, { height: Math.max(0, props.position.y) }]}
    >
      <Tooltip {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
    zIndex: 10000,
  },
});
