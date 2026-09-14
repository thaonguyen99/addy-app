import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TourTarget } from "@wrack/react-native-tour-guide";

import {
  TAB_BAR_COLUMN_COUNT,
  TAB_BAR_DOCK_PADDING,
  TAB_BAR_ICON_SIZE,
} from "@/constants/tab-bar";
import { ONBOARDING_ADD_MEMORY_STEP_ID } from "@/features/onboarding/onboarding-tour";

const COLUMN_PERCENT = 100 / TAB_BAR_COLUMN_COUNT;

/**
 * Invisible spotlight target for the camera tab icon, positioned from the
 * tab bar's own known geometry instead of measuring the tab bar's custom
 * `tabBarButton` — react-navigation's internal button-slot layout makes that
 * an unreliable thing to wrap and measure (see the tabs layout's history).
 * Mounted once at the app root so it's in place before the tour's first
 * step ever needs it.
 */
export function AddMemoryTourTarget() {
  const insets = useSafeAreaInsets();

  return (
    <TourTarget
      id={ONBOARDING_ADD_MEMORY_STEP_ID}
      style={{
        position: "absolute",
        left: `${COLUMN_PERCENT}%`,
        width: `${COLUMN_PERCENT}%`,
        bottom: insets.bottom + TAB_BAR_DOCK_PADDING,
        height: TAB_BAR_ICON_SIZE,
        pointerEvents: "none",
      }}
    >
      <View style={{ flex: 1 }} />
    </TourTarget>
  );
}
