/**
 * Bottom tab dock geometry — shared between the actual tab bar
 * (app/(app)/(tabs)/_layout.tsx) and anything that needs to independently
 * know where a tab icon sits on screen (e.g. the onboarding tour's
 * add-memory spotlight, which can't rely on measuring a custom
 * `tabBarButton` — see features/onboarding/components/add-memory-tour-target.tsx).
 */
export const TAB_BAR_DOCK_PADDING = 16;
export const TAB_BAR_ICON_SIZE = 52;
export const TAB_BAR_COLUMN_COUNT = 3;
