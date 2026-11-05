import type { PropsWithChildren } from "react";
import { Platform, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FullWindowOverlay } from "react-native-screens";

function FullWindowSheetContainer({ children }: PropsWithChildren) {
  return (
    <FullWindowOverlay>
      {/* The overlay is its own native window: gestures need their own root. */}
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        {children}
      </GestureHandlerRootView>
    </FullWindowOverlay>
  );
}

/**
 * `containerComponent` for a BottomSheetModal that can open while a native
 * modal is up (e.g. a profile pushed inside a page sheet). On iOS the sheets
 * otherwise render under the modal and never show; Android needs nothing.
 */
export const OVER_MODALS_CONTAINER =
  Platform.OS === "ios" ? FullWindowSheetContainer : undefined;
