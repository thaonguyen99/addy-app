import { useWindowDimensions } from "react-native";

export const GRID_COLUMNS = 3;
export const GRID_GAP = 3;
export const PROFILE_SIDE_PADDING = 16;

/** Square tile size for a 3-column profile grid that fills the screen width. */
export function useGridTileSize(): number {
  const { width } = useWindowDimensions();
  return Math.floor(
    (width - PROFILE_SIDE_PADDING * 2 - GRID_GAP * (GRID_COLUMNS - 1)) /
      GRID_COLUMNS,
  );
}
